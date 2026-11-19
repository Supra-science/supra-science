export const dynamic = 'force-dynamic';
/**
 * Supra-Science — WhatsApp Business Cloud API Webhook Route Template
 * Framework: Next.js App Router (TypeScript)
 * Location in app: app/api/whatsapp/webhook/route.ts
 *
 * Handles:
 *  1. GET  — webhook verification (Meta sends hub.mode, hub.verify_token, hub.challenge)
 *  2. POST — incoming message / status event processing
 *
 * SECURITY:
 *  - Never commit real tokens. Read everything from environment variables.
 *  - Verify the X-Hub-Signature-256 header on POST requests.
 *  - This template sends NO messages; outbound sending lives in lib/whatsapp.ts.
 *
 * ENV VARS REQUIRED (server-side only):
 *  WHATSAPP_VERIFY_TOKEN      — your chosen verify token (you invent it; it must match Meta dashboard)
 *  WHATSAPP_ACCESS_TOKEN      — System User access token from Meta (server secret, never expose)
 *  WHATSAPP_PHONE_NUMBER_ID   — Phone Number ID of the verified WhatsApp Business number
 *  WHATSAPP_APP_SECRET        — Meta App secret, used to validate X-Hub-Signature-256
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Supabase persistence (service_role, server-side only).
// Defensive: any DB failure is logged by message ID only and never breaks
// the 200 acknowledgement Meta requires (Meta retries on non-2xx).
// ---------------------------------------------------------------------------
function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("WhatsApp persistence is not configured");
  return createClient(url, key);
}

async function getOrCreateConversationId(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  phoneE164: string
): Promise<string | null> {
  const { data: existing, error: lookupError } = await supabase
    .from("whatsapp_conversations")
    .select("id")
    .eq("phone_e164", phoneE164)
    .maybeSingle();
  if (lookupError) throw lookupError;
  if (existing?.id) return existing.id as string;

  const { data: created, error: insertError } = await supabase
    .from("whatsapp_conversations")
    .insert({ phone_e164: phoneE164, status: "open" })
    .select("id")
    .single();
  if (!insertError && created?.id) return created.id as string;

  // Concurrent webhook deliveries can race to create the same conversation.
  if ((insertError as { code?: string } | null)?.code === "23505") {
    const { data: raced, error: retryError } = await supabase
      .from("whatsapp_conversations")
      .select("id")
      .eq("phone_e164", phoneE164)
      .maybeSingle();
    if (!retryError && raced?.id) return raced.id as string;
    if (retryError) throw retryError;
  }
  if (insertError) throw insertError;
  throw new Error("WhatsApp conversation could not be created");
}

// ---------------------------------------------------------------------------
// GET — Webhook verification handshake
// Meta calls: GET /api/whatsapp/webhook?hub.mode=subscribe
//   &hub.verify_token=<YOUR_VERIFY_TOKEN>&hub.challenge=<RANDOM_STRING>
// Respond with the challenge string and HTTP 200 only if the token matches.
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === "subscribe" && token && verifyToken && token === verifyToken) {
    // Verification succeeded — echo the challenge back to Meta.
    return new NextResponse(challenge ?? "", { status: 200 });
  }

  // Token mismatch — refuse verification.
  return new NextResponse("Forbidden", { status: 403 });
}

// ---------------------------------------------------------------------------
// Signature validation helper (POST)
// ---------------------------------------------------------------------------
function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret) return false;

  const expected = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Header format: "sha256=<hex>"
  const received = signatureHeader.replace(/^sha256=/, "");
  if (received.length !== expected.length) return false;

  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));
}

// ---------------------------------------------------------------------------
// POST — Incoming webhook events
// Event types: messages (incoming customer text), statuses (sent/delivered/read),
// errors. Persist to Supabase (whatsapp_messages / whatsapp_conversations),
// then trigger the appropriate workflow step. Never auto-reply with anything
// the customer did not opt into.
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256");

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Meta may send test pings with object !== "whatsapp_business_account"
  if (payload.object !== "whatsapp_business_account") {
    return NextResponse.json({ received: true });
  }

  try {
    interface WhatsAppEntry { changes?: Array<{ value?: { messages?: Array<Record<string, unknown>>; statuses?: Array<Record<string, unknown>> } }> }
    const entries = (payload.entry as WhatsAppEntry[] | undefined) ?? [];
    for (const entry of entries) {
      for (const change of entry.changes ?? []) {
        const value = change.value ?? {};

        const messages = (value.messages as Array<Record<string, unknown>> | undefined) ?? [];
        for (const message of messages) {
          const textObj = message.text as { body?: string } | undefined;
          await handleIncomingMessage({
            from: message.from as string,
            messageId: message.id as string,
            timestamp: message.timestamp as string,
            type: message.type as string,
            text: textObj?.body ?? null,
            interactive: message.interactive as Record<string, unknown> | null ?? null,
            context: message.context as Record<string, unknown> | null ?? null,
          });
        }

        const statuses = (value.statuses as Array<Record<string, unknown>> | undefined) ?? [];
        for (const status of statuses) {
          await handleStatusUpdate({
            messageId: status.id as string,
            recipientId: status.recipient_id as string,
            status: status.status as string,
            timestamp: status.timestamp as string,
            errors: (status.errors as unknown[]) ?? [],
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // Return non-2xx only when persistence failed; Meta can retry delivery.
    console.error("[whatsapp] webhook persistence failed:", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "Webhook persistence temporarily unavailable" }, { status: 503 });
  }
}

async function handleIncomingMessage(msg: {
  from: string;
  messageId: string;
  timestamp: string;
  type: string;
  text: string | null;
  interactive: unknown;
  context: unknown;
}): Promise<void> {
  const supabase = supabaseAdmin();
  const conversationId = await getOrCreateConversationId(supabase, msg.from);
  // Idempotent on waba_message_id: Meta may redeliver.
  const { error } = await supabase.from("whatsapp_messages").upsert(
    {
      conversation_id: conversationId,
      waba_message_id: msg.messageId,
      direction: "inbound",
      message_type: msg.type,
      body: msg.text,
      status: "received",
      raw_payload: { timestamp: msg.timestamp, interactive: msg.interactive, context: msg.context },
    },
    { onConflict: "waba_message_id", ignoreDuplicates: true }
  );
  if (error) throw error;
  // NOTE: no auto-reply here. Outbound messages require an explicit
  // approved trigger (see src/lib/whatsapp.ts and /api/admin/whatsapp/send).
}

async function handleStatusUpdate(st: {
  messageId: string;
  recipientId: string;
  status: string;
  timestamp: string;
  errors: unknown[];
}): Promise<void> {
  const supabase = supabaseAdmin();
  const { error } = await supabase
    .from("whatsapp_messages")
    .update({ status: st.status })
    .eq("waba_message_id", st.messageId);
  if (error) throw error;
  if (st.status === "failed") {
    console.error("[whatsapp] delivery failed:", st.messageId, JSON.stringify(st.errors).slice(0, 300));
  }
}
