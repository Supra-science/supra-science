import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  chatWithWorkersAI,
  chatWithGemini,
  withTimeout,
  ruleBasedReply,
  isWorkersAIAvailable,
  formatStartingPrices,
  type ChatMessage as EngineChatMessage,
} from "@/lib/ai-engine";
// TODO(RECONSTRUCTION-GAP): the live bundle only preserves minified export
// letters for src/lib/ai-engine.ts. The names used here are descriptive
// reconstructions — align them with the lib reconstruction (ai-engine
// exports, minified: M=formatStartingPrices, a=chatWithWorkersAI,
// z=chatWithGemini, l=ruleBasedReply, u=isWorkersAIAvailable).
// The engine fallback chain and the OpenAI direct call below are verbatim
// from the bundle; the OpenAI model is gpt-4o-mini, max_tokens 800,
// temperature 0.6.

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

type ChatMessage = { role: "user" | "assistant"; content: string };

function sanitizeHistory(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatMessage[] = [];
  for (const item of raw.slice(-6)) {
    if (
      typeof item === "object" &&
      item !== null &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    ) {
      const content = item.content.trim().slice(0, 1000);
      if (content) out.push({ role: item.role, content });
    }
  }
  return out;
}

/**
 * POST /api/ai/public-assistant — anonymous public assistant (no sign-in,
 * no database, no conversation persistence).
 *
 * Body: { message: string (1–2000 chars), history?: last 6 messages,
 *         lang?: "en" | "ar" (anything else → "ar"),
 *         recaptcha_token? }
 * Response: { reply: string, engine: "workers-ai" | "gemini" | "openai" |
 *             "rule-based" }
 *
 * Flow: rate-limit 10/hour per IP (429) → validate message (400) →
 * reCAPTCHA verify (403 unless the gate is not configured) → build the
 * system prompt (which, unlike the authenticated assistant, MAY quote the
 * published starting prices) → try Workers AI, then Gemini, then OpenAI
 * directly, then a local rule-based reply.
 *
 * GET returns { configured: true, engine } — the engine that would be
 * tried first given the current environment.
 * (Reconstructed from the Nov-8 live bundle, userland module 3455.)
 *
 * How it differs from the authenticated /api/ai/assistant route (Nov-5):
 * no Supabase auth (no 401), no conversation_id / ownership check, no
 * ai_conversations / ai_messages rows are read or written, history comes
 * from the client request instead of the database, the message limit is
 * 2000 chars (vs 4000), history is capped at 6 messages (vs 12), and the
 * system prompt includes the published starting prices (the authed
 * assistant's prompt forbids inventing any prices).
 */
export async function POST(req: NextRequest) {
  try {
    if (
      isRateLimited(`public-ai:${clientIp(req)}`, {
        // Approved 2026-11-14 (decision 2): 10 messages per hour per IP,
        // to stop free-tier quota drain by automated abuse.
        windowMs: 60 * 60_000,
        max: 10,
      })
    ) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const message =
      typeof body.message === "string" ? body.message.trim() : "";
    const lang = body.lang === "en" ? "en" : "ar";
    const history = sanitizeHistory(body.history);

    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const recaptchaToken =
      typeof body.recaptcha_token === "string" ? body.recaptcha_token : null;
    const recaptcha = await verifyRecaptcha(recaptchaToken, "public_assistant", clientIp(req));
    if (!recaptcha.verified) {
      return NextResponse.json(
        {
          error:
            "Human verification failed. Please try again, or reach us directly on WhatsApp (+1 917 818-3426).",
        },
        { status: 403 },
      );
    }

    const messages: EngineChatMessage[] = [
      {
        role: "system",
        content: `You are the public Supra-Science assistant on the company website, answering anonymous visitors.

Supra-Science works across five service domains:
- Digital products and applications.
- Software and artificial intelligence.
- Embedded systems and Internet of Things.
- Scientific and medical technology prototypes.
- Business automation and WhatsApp integrations.

PUBLISHED STARTING PRICES (USD, indicative — you MAY quote these):
${formatStartingPrices(lang)}
The final price is always set in a written quotation after the team reviews the project scope.

FREE TO START (costs the visitor nothing):
- Free 30-minute consultation (bookable on the website).
- Free requirements & scope review.
- Free architecture draft from the intake wizard.
- No payment before the visitor approves the written scope.
- Free written quotation, no obligation.

Use only these service domains unless an administrator has supplied updated, verified service information. Do not introduce unrelated disciplines or claim certifications, regulatory approvals, customers, testimonials, delivered projects, or capabilities that are not documented.

Brand context: professional, precise, confident, helpful. The visual identity is deep navy, tech blue and electric cyan. Answer in ${lang === "ar" ? "Arabic" : "English"} unless the visitor writes in the other language, then match theirs.

HARD RULES:
1. Quote ONLY the published starting prices above. Never invent other prices, discounts, delivery dates, budgets, or commercial terms. Explain that the team prepares a quotation after reviewing the project scope.
2. Never approve a quotation, issue a refund, claim a payment was processed, or make a financial commitment. Official quotations require the team to confirm.
3. Never invent or repeat an unverified phone number or contact channel. Refer visitors to the contact details shown on the official website, the contact page, or the free consultation booking.
4. Do not fabricate clients, testimonials, certifications, regulatory approvals, or completed projects.
5. For medical-technology questions, provide general engineering information only; never provide medical advice or diagnoses. Prototype work is not evidence of a certified medical device.
6. Keep answers concise. Ask one clarifying question at a time when requirements are missing.
7. If information is unknown, say so clearly and offer the contact page or the free consultation.`,
      },
      ...history,
      { role: "user", content: message },
    ];

    let reply: string | null = null;
    let engine: "workers-ai" | "gemini" | "openai" | "rule-based" =
      "rule-based";

    try {
      reply = await chatWithWorkersAI(messages);
      engine = "workers-ai";
    } catch (err) {
      console.error(
        "Workers AI unavailable:",
        err instanceof Error ? err.message : err,
      );
    }

    if (reply === null && process.env.GEMINI_API_KEY) {
      try {
        reply = await chatWithGemini(messages);
        engine = "gemini";
      } catch (err) {
        console.error(
          "Gemini unavailable:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    if (reply === null && process.env.OPENAI_API_KEY) {
      try {
        const res = await withTimeout(fetch("https://api.openai.com/v1/chat/completions", {
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
        }), 15_000, "OpenAI");
        if (res.ok) {
          const data = await res.json();
          const text = data?.choices?.[0]?.message?.content?.trim();
          if (text) {
            reply = text;
            engine = "openai";
          }
        } else {
          const text = await res.text().catch(() => "");
          console.error("OpenAI error", res.status, text.slice(0, 500));
        }
      } catch (err) {
        console.error(
          "OpenAI call failed:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    if (reply === null) {
      reply =
        ruleBasedReply(message) ??
        "I could not generate a response. Please use the contact details on the official Supra-Science website.";
    }

    return NextResponse.json({ reply, engine });
  } catch (err) {
    console.error("public assistant route error", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  const engine = isWorkersAIAvailable()
    ? "workers-ai"
    : process.env.GEMINI_API_KEY
      ? "gemini"
      : process.env.OPENAI_API_KEY
        ? "openai"
        : "rule-based";
  return NextResponse.json({ configured: true, engine });
}
