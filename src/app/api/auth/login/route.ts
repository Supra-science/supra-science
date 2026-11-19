// src/app/api/auth/login/route.ts — server-side sign-in (added 2026-11-13, audit finding #6).
//
// POST { email, password, recaptcha_token }
// The login pages used to call signInWithPassword directly from the
// browser — no rate limit, no bot check. This route adds both:
//  - Rate limit per IP (10 attempts / 15 min) and per email (5 / 15 min),
//    in-memory per Worker isolate (same approximation as the public
//    assistant route; Supabase Auth also rate-limits behind it).
//  - reCAPTCHA v3, action "login", fail-closed (see src/lib/recaptcha.ts).
// Then Supabase signInWithPassword via the SSR server client, which sets
// the session cookies on the response.
// If the account has an enrolled TOTP factor, the session stays at AAL1
// and the response asks the client to complete verification
// ({ mfa_required: true, factorId }) via /api/auth/mfa-verify.
// Errors are generic ("Invalid email or password") — no account enumeration.
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

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const recaptchaToken =
    typeof body.recaptcha_token === "string" ? body.recaptcha_token : null;

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  // 1. Rate limit — before any other work, so neither the captcha nor
  //    the password check can be brute-forced through this route.
  if (
    isRateLimited(`login:ip:${ip}`, { windowMs: 15 * 60_000, max: 10 }) ||
    isRateLimited(`login:email:${email}`, { windowMs: 15 * 60_000, max: 5 })
  ) {
    return NextResponse.json(
      { error: "Too many sign-in attempts. Please wait 15 minutes and try again." },
      { status: 429 },
    );
  }

  // 2. reCAPTCHA v3, action "login" — fail-closed on any failure.
  const recaptcha = await verifyRecaptcha(recaptchaToken, "login", ip);
  if (!recaptcha.verified) {
    // NOTE (2026-11-19): log the reason (low_score / missing_token /
    // action_mismatch / ...) — the user-facing message is generic, so
    // without this the next login failure is undiagnosable in the logs.
    console.warn("[recaptcha] login rejected:", recaptcha.reason);
    return NextResponse.json(
      { error: "Human verification failed. Please try again." },
      { status: 403 },
    );
  }

  // 3. Sign in (server client sets the session cookies).
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) {
    return NextResponse.json(
      { error: "Invalid email or password." },
      { status: 401 },
    );
  }

  // 4. MFA: an enrolled TOTP factor means this session is AAL1 only.
  try {
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (totp) {
        return NextResponse.json({
          ok: false,
          mfa_required: true,
          factorId: totp.id,
        });
      }
    }
  } catch {
    // AAL check is best-effort: the signed-in session is still valid.
  }

  return NextResponse.json({ ok: true });
}
