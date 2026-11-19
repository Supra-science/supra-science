export const dynamic = "force-dynamic";
/**
 * Supra-Science AI Assistant — authenticated chat.
 * Endpoint: POST /api/ai/assistant
 *
 * Provider chain (first success wins):
 * 1. Cloudflare Workers AI, 2. Google Gemini, 3. OpenAI gpt-4o-mini,
 * 4. local rule-based answer from the service catalog.
 * Response: { reply, conversation_id, engine }.
 *
 * SECURITY:
 * - Requires a valid Supabase session (401 otherwise).
 * - A conversation_id from the client is verified against auth.uid()
 *   before its history is read (404 when not owned).
 * - customer_id is NOT accepted from the client.
 * - The assistant MUST NOT approve quotations, issue refunds, or make
 *   financial commitments. It may quote ONLY the published starting
 *   prices; official quotations require administrator approval.
 *
 * Env used: OPENAI_API_KEY, GEMINI_API_KEY, NEXT_PUBLIC_SUPABASE_URL,
 * SUPABASE_SERVICE_ROLE_KEY (server-side only).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import {
  chatWithWorkersAI,
  chatWithGemini,
  localAnswer,
  getWorkersAI,
  servicePriceLines,
  freeOffers,
  type ChatMessage,
} from "@/lib/ai-engine";

const MAX_HISTORY_MESSAGES = 12;
const MAX_MESSAGE_LENGTH = 4000;
const AI_RATE_LIMIT_MAX = 10; // requests per minute per user

const SUPRA_SYSTEM_PROMPT = `You are the Supra-Science project inquiry assistant.

Supra-Science works across five service domains:
- Digital products and applications.
- Software and artificial intelligence.
- Embedded systems and Internet of Things.
- Scientific and medical technology prototypes.
- Business automation and WhatsApp integrations.

PUBLISHED STARTING PRICES (USD, indicative — you MAY quote these):
${servicePriceLines("en")}
The final price is always set in a written quotation after the team reviews the project scope.

FREE TO START (costs the client nothing):
${freeOffers("en")
  .map((o) => `- ${o}.`)
  .join("\n")}

Use only these service domains unless an administrator has supplied updated, verified service information. Do not introduce unrelated disciplines or claim certifications, regulatory approvals, customers, testimonials, delivered projects, or capabilities that are not documented.

Brand context: professional, precise, confident, helpful. The visual identity is deep navy, tech blue and electric cyan. Support Arabic and English.

HARD RULES:
1. Quote ONLY the published starting prices above. Never invent other prices, discounts, delivery dates, budgets, or commercial terms. Explain that the team prepares a quotation after reviewing the project scope.
2. Never approve a quotation, issue a refund, claim a payment was processed, or make a financial commitment. Official quotations require administrator approval.
3. Never invent or repeat an unverified phone number or contact channel. Refer users to the contact details shown on the official website.
4. Do not fabricate clients, testimonials, certifications, regulatory approvals, or completed projects.
5. For medical-technology questions, provide general engineering information only; never provide medical advice or diagnoses. Prototype work is not evidence of a certified medical device.
6. Keep answers concise. Ask one clarifying question at a time when requirements are missing.
7. If information is unknown, say so clearly and offer to pass the inquiry to the team.`;

function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase server env not configured");
  return createClient(url, key);
}

async function getConversationHistory(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  conversationId: string
): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(MAX_HISTORY_MESSAGES);
  if (error) throw error;
  return (data ?? []).map((m: { role: string; content: string }) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
  }));
}

export async function POST(req: NextRequest) {
  try {
    // --- Authentication: require a valid Supabase session ---
    const authSupabase = await createServerSupabase();
    const {
      data: { user },
    } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- Rate limiting: 10 requests/minute per user ---
    if (isRateLimited(`ai:${user.id}`, { max: AI_RATE_LIMIT_MAX })) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = typeof body.message === "string" ? body.message.trim() : "";
    let conversationId: string | null =
      typeof body.conversation_id === "string" && body.conversation_id.trim()
        ? body.conversation_id.trim()
        : null;

    if (!message || message.length > MAX_MESSAGE_LENGTH) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    // Service-role client for history (optional — the chat still works
    // without it, with an empty history).
    let supabase: ReturnType<typeof supabaseAdmin> | null = null;
    try {
      supabase = supabaseAdmin();
    } catch {
      supabase = null;
    }

    // Verify ownership before reading history; create a conversation
    // when the client did not supply one.
    let history: ChatMessage[] = [];
    if (supabase) {
      try {
        if (conversationId) {
          const { data: owned, error: ownershipError } = await supabase
            .from("ai_conversations")
            .select("id")
            .eq("id", conversationId)
            .eq("user_id", user.id)
            .maybeSingle();
          if (ownershipError) throw ownershipError;
          if (!owned) {
            return NextResponse.json(
              { error: "Conversation not found" },
              { status: 404 }
            );
          }
        } else {
          const { data, error } = await supabase
            .from("ai_conversations")
            .insert({ user_id: user.id })
            .select("id")
            .single();
          if (error) throw error;
          conversationId = data.id as string;
        }
        history = await getConversationHistory(supabase, conversationId);
      } catch (err) {
        console.error(
          "assistant history unavailable:",
          err instanceof Error ? err.message : err
        );
        conversationId = null;
        history = [];
      }
    }

    const messages: ChatMessage[] = [
      { role: "system", content: SUPRA_SYSTEM_PROMPT },
      ...history,
      { role: "user", content: message },
    ];

    // --- Provider chain: Workers AI -> Gemini -> OpenAI -> local ---
    let reply: string | null = null;
    let engine = "rule-based";
    try {
      reply = await chatWithWorkersAI(messages);
      engine = "workers-ai";
    } catch (err) {
      console.error(
        "Workers AI unavailable:",
        err instanceof Error ? err.message : err
      );
    }
    if (reply === null && process.env.GEMINI_API_KEY) {
      try {
        reply = await chatWithGemini(messages);
        engine = "gemini";
      } catch (err) {
        console.error(
          "Gemini unavailable:",
          err instanceof Error ? err.message : err
        );
      }
    }
    if (reply === null && process.env.OPENAI_API_KEY) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 800,
            temperature: 0.6,
          }),
        });
        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) {
            reply = text;
            engine = "openai";
          }
        } else {
          const errText = await openaiRes.text().catch(() => "");
          console.error("OpenAI error", openaiRes.status, errText.slice(0, 500));
        }
      } catch (err) {
        console.error(
          "OpenAI call failed:",
          err instanceof Error ? err.message : err
        );
      }
    }

    // The exchange is persisted for EVERY engine, not only the local
    // fallback: the Nov-8 live code inserted into ai_messages only
    // inside the `reply === null` branch below, so AI-generated replies
    // were returned but never saved to history. Fixed 2026-11-09 —
    // same insert, same error handling, moved out of the branch.
    if (reply === null) {
      reply =
        localAnswer(message) ||
        "I could not generate a response. Please use the contact details on the official Supra-Science website.";
    }
    if (supabase && conversationId) {
      try {
        const { error } = await supabase.from("ai_messages").insert([
          { conversation_id: conversationId, role: "user", content: message },
          { conversation_id: conversationId, role: "assistant", content: reply },
        ]);
        if (error) throw error;
      } catch (err) {
        console.error(
          "assistant persist failed:",
          err instanceof Error ? err.message : err
        );
      }
    }

    return NextResponse.json({
      reply,
      conversation_id: conversationId,
      engine,
    });
  } catch (err) {
    console.error("assistant route error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Health check: which engine would answer first.
export async function GET() {
  const engine = getWorkersAI()
    ? "workers-ai"
    : process.env.GEMINI_API_KEY
      ? "gemini"
      : process.env.OPENAI_API_KEY
        ? "openai"
        : "rule-based";
  return NextResponse.json({ configured: true, engine });
}
