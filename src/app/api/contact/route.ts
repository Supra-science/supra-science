export const dynamic = 'force-dynamic';
/**
 * POST /api/contact — public website contact form.
 *
 * Body: { name, email, phone?, subject, message, preferred_contact?, recaptcha_token? }
 *
 * Flow:
 * 1. Rate-limit by IP (5 / 10 min) to prevent spam abuse.
 * 2. Validate payload (never trust the client).
 * 3. reCAPTCHA v3 check (403 unless the gate is not configured).
 *    Added in Nov-8; the Nov-5 route had no human verification.
 * 4. Save to public.contact_messages via service_role (RLS bypass, server-only).
 * 5. Try to email the business inbox via the Gmail API.
 *    - If Gmail is not configured, the message is still saved; response
 *      reports emailSent:false so the UI stays honest.
 * 6. Returns { ok:true, emailSent:boolean }.
 *
 * preferred_contact is now email | whatsapp | meet (Nov-5 had "call"
 * instead of "meet"). No auth required (public form). No secrets leave
 * the server.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  validateContact,
  sendContactNotification,
  BUSINESS_EMAIL,
} from "@/lib/email";

function getServiceSupabase() {
  const url =
    process.env.SUPABASE_URL || "https://ityzbuncztwgtxudcobr.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials not set");
  return createAdminClient(url, key);
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  try {
    // --- 1. Rate limit ---
    if (isRateLimited(`contact:${clientIp(req)}`, { windowMs: 10 * 60_000, max: 5 })) {
      return NextResponse.json(
        { ok: false, error: "Too many messages. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    // --- 2. Validate ---
    const body = await req.json().catch(() => ({}));
    const validationError = validateContact(body);
    if (validationError) {
      return NextResponse.json({ ok: false, error: validationError }, { status: 400 });
    }

    const name = String(body.name).trim();
    const email = String(body.email).trim();
    const phone = body.phone ? String(body.phone).trim().slice(0, 40) : null;
    const subject = String(body.subject).trim();
    const message = String(body.message).trim();
    const preferredContact = ["email", "whatsapp", "meet"].includes(body.preferred_contact)
      ? String(body.preferred_contact)
      : "email";

    // --- 3. reCAPTCHA v3 (added Nov-8) ---
    const recaptchaToken =
      typeof body.recaptcha_token === "string" ? body.recaptcha_token : null;
    const recaptcha = await verifyRecaptcha(recaptchaToken, ["contact", "intake"], clientIp(req));
    if (!recaptcha.verified) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Human verification failed. Please try again, or reach us directly on WhatsApp (+1 917 818-3426).",
        },
        { status: 403 }
      );
    }

    // --- 4. Save to Supabase (service_role, server-only) ---
    let emailSent = false;
    try {
      const admin = getServiceSupabase();

      // Try email notification first so we can record the outcome on the row.
      const mail = await sendContactNotification({
        name, email, phone: phone || undefined, subject, message,
        preferredContact,
      });
      emailSent = mail.sent;

      const { error } = await admin.from("contact_messages").insert({
        name, email, phone, subject, message,
        preferred_contact: preferredContact,
        email_sent: emailSent,
      });
      if (error) throw error;
    } catch (dbErr) {
      const msg = dbErr instanceof Error ? dbErr.message : "database error";
      // Table missing (migrations not applied yet) → honest 503, not a fake success.
      return NextResponse.json(
        { ok: false, error: `Message could not be saved yet: ${msg.slice(0, 120)}` },
        { status: 503 }
      );
    }

    // --- 5. Honest response ---
    return NextResponse.json({
      ok: true,
      emailSent,
      inbox: BUSINESS_EMAIL,
      note: emailSent
        ? "Your message was saved and emailed to our team."
        : "Your message was saved. Email notification is not configured yet — we will read it in the admin dashboard.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
