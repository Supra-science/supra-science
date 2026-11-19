/**
 * Supra-Science — WhatsApp Business Cloud API outbound client.
 * ============================================================
 * SERVER-SIDE ONLY. Never import this module from a client component.
 * Secrets are read from environment variables at call time and are never
 * logged, printed, or embedded in responses.
 *
 * Safety model:
 * - `dryRun` defaults to TRUE: no real message leaves the server unless the
 *   caller explicitly passes { dryRun: false }.
 * - Recipient numbers are normalized to E.164 digits and validated.
 * - Missing configuration throws a safe, actionable error (no secret values).
 */

const GRAPH_VERSION = "v21.0";
const MAX_BODY_LENGTH = 4000;

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
}

export interface WhatsAppSendResult {
  ok: boolean;
  dryRun: boolean;
  messageId: string | null;
  to: string;
}

/** Read and validate server-side WhatsApp configuration. Throws if incomplete. */
export function getWhatsAppConfig(): WhatsAppConfig {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const missing: string[] = [];
  if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
  if (!phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
  if (missing.length > 0) {
    throw new Error(
      `WhatsApp is not configured. Missing: ${missing.join(", ")}. ` +
        "Set them as server secrets (never in client code or chat)."
    );
  }
  return { accessToken: accessToken as string, phoneNumberId: phoneNumberId as string };
}

/**
 * Normalize a phone number to E.164 digits (no leading "+").
 * Throws on obviously invalid input. Never throws on secret material.
 */
export function normalizeE164(raw: string): string {
  const digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new Error("Invalid recipient phone number: expected 8-15 digits.");
  }
  return digits;
}

/**
 * Send a WhatsApp text message via the Cloud API.
 * DRY-RUN BY DEFAULT — pass { dryRun: false } only from an explicitly
 * authorized admin/test flow with a verified test recipient.
 */
export async function sendWhatsAppText(
  to: string,
  body: string,
  opts: { dryRun?: boolean } = {}
): Promise<WhatsAppSendResult> {
  const recipient = normalizeE164(to);
  const text = (body ?? "").trim();
  if (!text) throw new Error("Message body is required.");
  if (text.length > MAX_BODY_LENGTH) {
    throw new Error(`Message body too long (${text.length} > ${MAX_BODY_LENGTH}).`);
  }

  const dryRun = opts.dryRun ?? true;
  if (dryRun) {
    return { ok: true, dryRun: true, messageId: null, to: recipient };
  }

  const { accessToken, phoneNumberId } = getWhatsAppConfig();

  const res = await fetch(
    `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: recipient,
        type: "text",
        text: { body: text },
      }),
    }
  );

  const data = (await res.json().catch(() => ({}))) as {
    messages?: Array<{ id?: string }>;
    error?: { message?: string; code?: number };
  };

  if (!res.ok) {
    // Surface Meta's error message text only — never tokens or headers.
    const detail = data?.error?.message ? `: ${data.error.message}` : "";
    throw new Error(`WhatsApp send failed (HTTP ${res.status})${detail}`);
  }

  return {
    ok: true,
    dryRun: false,
    messageId: data?.messages?.[0]?.id ?? null,
    to: recipient,
  };
}

