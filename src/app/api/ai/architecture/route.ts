export const dynamic = 'force-dynamic';
/**
 * Supra-Science AI Architecture Generator — API route
 * ====================================================
 * Endpoint: POST /api/ai/architecture
 *
 * Generates a STRUCTURED architecture draft (JSON) for a customer project
 * brief, validates it server-side, and persists it to architecture_drafts.
 *
 * SECURITY: server-side only. GEMINI_API_KEY never leaves the server.
 * Output is always labeled DRAFT — a qualified human must review before
 * any engineering commitment. The generator never creates cloud resources,
 * purchases services, or deploys anything.
 *
 * Request body: {
 *   title: string (3-120),
 *   goals: string (10-2000),
 *   constraints?: string, features?: string, platforms?: string,
 *   integrations?: string, securityNeeds?: string (each ≤ 2000),
 *   budgetRange?: string, timeline?: string (each ≤ 200),
 *   serviceDomain?: string (≤ 60)
 * }
 * Response: { draft: ArchitectureDraft, draft_id: string | null,
 *             persisted: boolean, disclaimer: string }
 *
 * Env required: GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 *               SUPABASE_SERVICE_ROLE_KEY (server-side only)
 *
 * NOTE (2026-11-18): the generator originally called OpenAI gpt-4o-mini
 * via OPENAI_API_KEY. That key was never set on the production Worker, so
 * every generation failed with 503 "Architecture generator not configured".
 * It now uses Gemini (gemini-3.8-flash, JSON mode) via the existing
 * GEMINI_API_KEY secret — $0, no new key needed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerSupabase } from '@/lib/supabase/server';
import { isRateLimited } from '@/lib/rate-limit';
import { generateJsonWithGemini, generateWithWorkersAI } from '@/lib/ai-engine';

const ARCH_RATE_LIMIT_MAX = 5; // generations per minute per user (expensive op)
const MAX_BRIEF_FIELD = 2000;

const ARCH_SYSTEM_PROMPT = `You are the Supra-Science solution architecture generator. Given a customer project brief, produce a structured architecture DRAFT.

Respond with STRICT JSON ONLY — no markdown fences, no commentary. Exact schema:
{
  "summary": "2-4 sentence plain-language summary",
  "components": ["proposed component 1", "component 2", ...],
  "data_flow": "how data moves through the system, 2-5 sentences",
  "integrations": ["external system / API 1", ...],
  "security": ["security and privacy consideration 1", ...],
  "risks": ["risk 1", ...],
  "assumptions": ["assumption 1", ...],
  "phases": ["phase 1: ...", "phase 2: ...", ...],
  "open_questions": ["question 1", ...]
}

HARD RULES:
1. This is a DRAFT for human review — never present it as certified engineering, medical-device compliance, or a final production design.
2. Never invent prices, delivery dates, certifications, clients, or testimonials.
3. Keep each array to 3-8 concise items. Be specific to the brief, not generic.
4. If the brief is too vague, put clarifying needs in "open_questions" rather than guessing silently.`;

const DRAFT_DISCLAIMER =
  'DRAFT — AI-generated architecture for human review only. Not certified engineering. A qualified Supra-Science engineer must review before any commitment.';

export interface ArchitectureDraft {
  summary: string;
  components: string[];
  data_flow: string;
  integrations: string[];
  security: string[];
  risks: string[];
  assumptions: string[];
  phases: string[];
  open_questions: string[];
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}

function optStr(v: unknown, max: number): string | null {
  if (v === undefined || v === null) return null;
  if (typeof v !== 'string') return null;
  const t = v.trim();
  if (!t) return null;
  return t.length > max ? null : t;
}

/** Server-side shape validation of the model output. Returns null when invalid. */
export function validateDraftShape(raw: unknown): ArchitectureDraft | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const strArr = (v: unknown): string[] | null =>
    Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : null;
  const summary = typeof o.summary === 'string' ? o.summary.trim() : '';
  const data_flow = typeof o.data_flow === 'string' ? o.data_flow.trim() : '';
  const components = strArr(o.components);
  const integrations = strArr(o.integrations);
  const security = strArr(o.security);
  const risks = strArr(o.risks);
  const assumptions = strArr(o.assumptions);
  const phases = strArr(o.phases);
  const open_questions = strArr(o.open_questions);
  if (!summary || !data_flow) return null;
  const lists = [components, integrations, security, risks, assumptions, phases, open_questions];
  if (lists.some((l) => l === null)) return null;
  return {
    summary, data_flow,
    components: components as string[],
    integrations: integrations as string[],
    security: security as string[],
    risks: risks as string[],
    assumptions: assumptions as string[],
    phases: phases as string[],
    open_questions: open_questions as string[],
  };
}

function extractJson(text: string): unknown {
  // Strip markdown fences if the model added them despite instructions.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = (fenced ? fenced[1] : text).trim();
  return JSON.parse(candidate);
}

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase server env not configured');
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createServerSupabase();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (isRateLimited(`arch:${user.id}`, { max: ARCH_RATE_LIMIT_MAX })) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait a minute and try again.' },
        { status: 429 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Architecture generator not configured' },
        { status: 503 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const title = str(body.title, 120);
    const goals = str(body.goals, MAX_BRIEF_FIELD);
    if (!title || title.length < 3) {
      return NextResponse.json({ error: 'Title is required (3-120 characters).' }, { status: 400 });
    }
    if (!goals || goals.length < 10) {
      return NextResponse.json({ error: 'Goals are required (10-2000 characters).' }, { status: 400 });
    }
    const brief = {
      title,
      goals,
      constraints: optStr(body.constraints, MAX_BRIEF_FIELD),
      features: optStr(body.features, MAX_BRIEF_FIELD),
      platforms: optStr(body.platforms, MAX_BRIEF_FIELD),
      integrations: optStr(body.integrations, MAX_BRIEF_FIELD),
      securityNeeds: optStr(body.securityNeeds, MAX_BRIEF_FIELD),
      budgetRange: optStr(body.budgetRange, 200),
      timeline: optStr(body.timeline, 200),
      serviceDomain: optStr(body.serviceDomain, 60),
    };

    const briefText = [
      `Project title: ${brief.title}`,
      `Goals: ${brief.goals}`,
      brief.constraints ? `Constraints: ${brief.constraints}` : null,
      brief.features ? `Required features: ${brief.features}` : null,
      brief.platforms ? `Platforms: ${brief.platforms}` : null,
      brief.integrations ? `Integrations: ${brief.integrations}` : null,
      brief.securityNeeds ? `Security needs: ${brief.securityNeeds}` : null,
      brief.budgetRange ? `Budget range: ${brief.budgetRange}` : null,
      brief.timeline ? `Target timeline: ${brief.timeline}` : null,
      brief.serviceDomain ? `Service domain: ${brief.serviceDomain}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    let rawText: string;
    try {
      rawText = await generateJsonWithGemini([
        { role: 'system', content: ARCH_SYSTEM_PROMPT },
        { role: 'user', content: briefText },
      ]);
    } catch (geminiErr) {
      const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
      console.error('Gemini error', msg.slice(0, 500));
      if (msg.includes('not configured')) {
        return NextResponse.json(
          { error: 'Architecture generator not configured' },
          { status: 503 }
        );
      }
      // Fallback (2026-11-19): the generator previously depended on Gemini
      // alone, so any Gemini failure (bad key, quota, timeout, JSON-mode
      // rejection) killed every generation with 502. Workers AI is already
      // bound to the Worker and answers the same prompt; the output goes
      // through the same strict shape validation below.
      try {
        rawText = await generateWithWorkersAI([
          { role: 'system', content: ARCH_SYSTEM_PROMPT },
          { role: 'user', content: briefText },
        ]);
      } catch (workersErr) {
        const wmsg = workersErr instanceof Error ? workersErr.message : String(workersErr);
        console.error('Workers AI fallback error', wmsg.slice(0, 500));
        return NextResponse.json(
          { error: 'Generator temporarily unavailable' },
          { status: 502 }
        );
      }
    }

    let draft: ArchitectureDraft | null = null;
    try {
      draft = validateDraftShape(extractJson(rawText));
    } catch {
      draft = null;
    }
    if (!draft) {
      console.error('Architecture generator: model output failed validation');
      return NextResponse.json(
        { error: 'Generator returned an invalid draft. Please try again.' },
        { status: 502 }
      );
    }

    // Persist the draft. Degrade gracefully if the table is not migrated yet.
    let draftId: string | null = null;
    let persisted = false;
    try {
      const supabase = supabaseAdmin();
      const { data, error } = await supabase
        .from('architecture_drafts')
        .insert({ user_id: user.id, title: brief.title, brief, draft, status: 'draft' })
        .select('id')
        .single();
      if (!error && data) {
        draftId = data.id as string;
        persisted = true;
      } else if (error) {
        console.error('architecture draft persist failed:', error.message);
      }
    } catch (e) {
      console.error('architecture draft persist failed:', (e as Error).message);
    }

    return NextResponse.json({
      draft,
      draft_id: draftId,
      persisted,
      disclaimer: DRAFT_DISCLAIMER,
    });
  } catch (err) {
    console.error('architecture route error', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
