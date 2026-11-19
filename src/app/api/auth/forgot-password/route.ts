// src/app/api/auth/forgot-password/route.ts — server-side password reset
// (added 2026-11-19, audit finding M1).
//
// POST { email, recaptcha_token }
// The forgot-password pages used to call resetPasswordForEmail directly
// from the browser — no rate limit, no bot check, so anyone could mail-bomb
// any address (Supabase's own 30/hour mail limit was the only barrier) and
// probe whether an account exists. This route adds both gates, mirroring
// the login/signup server routes:
//  - Rate limit per IP (5 attempts / 15 min) and per email (3 / 15 min).
//  - reCAPTCHA v3, action "forgot-password", fail-closed (see
//    src/lib/recaptcha.ts), with reason logging like the login route.
// Then Supabase resetPasswordForEmail via the SSR server client.
// Anti-enumeration: after the gates pass the response is always the same
// generic success message, whether or not the address has an account —
// a Supabase failure is logged server-side, never shown to the caller.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

const GENERIC_MESSAGE =
  "If an account exists for this address, a password reset link has been sent.";

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const recaptchaToken =
    typeof body.recaptcha_token === "string" ? body.recaptcha_token : null;

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }

  // 1. Rate limit — before any other work, so the reset mail cannot be
  //    used to spam an address.
  if (
    isRateLimited(`forgot-password:ip:${ip}`, { windowMs: 15 * 60_000, max: 5 }) ||
    isRateLimited(`forgot-password:email:${email}`, { windowMs: 15 * 60_000, max: 3 })
  ) {
    return NextResponse.json(
      { error: "Too many reset attempts. Please wait 15 minutes and try again." },
      { status: 429 },
    );
  }

  // 2. reCAPTCHA v3, action "forgot-password" — fail-closed on any failure.
  const recaptcha = await verifyRecaptcha(recaptchaToken, "forgot-password", ip);
  if (!recaptcha.verified) {
    console.warn("[recaptcha] forgot-password rejected:", recaptcha.reason);
    return NextResponse.json(
      { error: "Human verification failed. Please try again." },
      { status: 403 },
    );
  }

  // 3. Request the reset mail. The response stays generic either way:
  //    it must not reveal whether the address has an account.
  const origin = new URL(req.url).origin;
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
    if (error) {
      console.error("[auth] forgot-password reset failed:", error.message);
    }
  } catch (err) {
    console.error(
      "[auth] forgot-password reset failed:",
      err instanceof Error ? err.message : "unknown",
    );
  }

  return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
}
