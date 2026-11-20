// src/app/api/admin/whatsapp/send/route.ts — PRE-EXISTING in Nov-5;
// behaviour UNCHANGED in the Nov-8 live build (live userland module 82144
// in chunk `_1l6nvx39juxzz._.js`).
// POST { to, text, dryRun? } — admin only. Sends a WhatsApp text message
// via the Cloud API (graph.facebook.com v21.0). DRY-RUN BY DEFAULT:
// dryRun defaults to true unless the body explicitly passes
// { dryRun: false }. Response: { ok, dryRun, messageId, to }.
// Validation errors (missing config, bad phone, missing/too-long body)
// return 400; other failures return 500.
// TODO(RECONSTRUCTION-GAP): the Nov-5 source imported sendWhatsAppText
// from src/lib/whatsapp.ts; the live bundle inlines the whole send
// implementation inside the route module. It is not possible to tell from
// the bundle alone whether the Nov-8 source still imports the lib (and the
// bundler inlined it) or the logic moved into the route file. The
// behaviour below is exact either way; src/lib/whatsapp.ts itself is out
// of scope for this admin reconstruction.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

function normalizePhone(to: string): string {
  const digits = (to ?? "").replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new Error("Invalid recipient phone number: expected 8-15 digits.");
  }
  return digits;
}

async function sendWhatsAppText(
  to: string,
  text: string,
  opts: { dryRun?: boolean } = {},
): Promise<{ ok: boolean; dryRun: boolean; messageId: string | null; to: string }> {
  const normalizedTo = normalizePhone(to);
  const body = (text ?? "").trim();
  if (!body) throw new Error("Message body is required.");
  if (body.length > 4000) throw new Error(`Message body too long (${body.length} > 4000).`);
  if (opts.dryRun ?? true) return { ok: true, dryRun: true, messageId: null, to: normalizedTo };

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const missing: string[] = [];
  if (!accessToken) missing.push("WHATSAPP_ACCESS_TOKEN");
  if (!phoneNumberId) missing.push("WHATSAPP_PHONE_NUMBER_ID");
  if (missing.length > 0) {
    throw new Error(`WhatsApp is not configured. Missing: ${missing.join(", ")}. Set them as server secrets (never in client code or chat).`);
  }

  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to: normalizedTo, type: "text", text: { body } }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.error?.message ? `: ${data.error.message}` : "";
    throw new Error(`WhatsApp send failed (HTTP ${res.status})${detail}`);
  }
  return { ok: true, dryRun: false, messageId: data?.messages?.[0]?.id ?? null, to: normalizedTo };
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin("whatsapp:manage");
    if (auth.error) return auth.error;
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const to = typeof body.to === "string" ? body.to : "";
    const text = typeof body.text === "string" ? body.text : "";
    // Explicit opt-in per call: dryRun defaults to true.
    const dryRun = body.dryRun !== false;
    if (!to || !text) {
      return NextResponse.json({ error: 'Both "to" and "text" are required.' }, { status: 400 });
    }
    const result = await sendWhatsAppText(to, text, { dryRun });
    return NextResponse.json({ ok: result.ok, dryRun: result.dryRun, messageId: result.messageId, to: result.to });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    const status = /not configured|Invalid recipient|required|too long/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
