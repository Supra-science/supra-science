// src/app/api/auth/signup/route.ts — server-side sign-up (added 2026-11-18, auth hardening).
//
// POST { name, email, password, recaptcha_token }
// Why a server route: the signup pages used to call signUp directly from
// the browser — no rate limit, no bot check, and the 12-character minimum
// was enforced only in the browser. This route adds:
//  - Rate limit per IP (5 attempts / 15 min) and per email (3 / 15 min).
//  - reCAPTCHA v3, action "signup", fail-closed (see src/lib/recaptcha.ts).
//  - Server-side validation: name 1-120 chars, email shape, password >= 12.
//  - Anti-enumeration: an already-registered email gets the same success
//    message as a new account (no hint whether the email exists).
// Email confirmation itself is enforced by Supabase Auth config
// (mailer_autoconfirm=false); the success message tells the user to
// confirm via email before signing in.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";

export const dynamic = "force-dynamic";

const MIN_PASSWORD_LENGTH = 12;

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
  const name =
    typeof body.name === "string" ? body.name.trim() : "";
  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const recaptchaToken =
    typeof body.recaptcha_token === "string" ? body.recaptcha_token : null;

  if (!name || name.length > 120) {
    return NextResponse.json(
      { error: "Full name is required (1-120 characters)." },
      { status: 400 },
    );
  }
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 },
    );
  }
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: "Password must be at least 12 characters." },
      { status: 400 },
    );
  }

  // 1. Rate limit — before any other work, so neither the captcha nor
  //    the sign-up can be abused to mass-create accounts.
  if (
    isRateLimited(`signup:ip:${ip}`, { windowMs: 15 * 60_000, max: 5 }) ||
    isRateLimited(`signup:email:${email}`, { windowMs: 15 * 60_000, max: 3 })
  ) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please wait 15 minutes and try again." },
      { status: 429 },
    );
  }

  // 2. reCAPTCHA v3, action "signup" — fail-closed on any failure.
  const recaptcha = await verifyRecaptcha(recaptchaToken, "signup", ip);
  if (!recaptcha.verified) {
    // NOTE (2026-11-19, L1): log the reason like the login route does —
    // a bare 403 left signup failures undiagnosable in the logs.
    console.warn("[recaptcha] signup rejected:", recaptcha.reason);
    return NextResponse.json(
      { error: "Human verification failed. Please try again." },
      { status: 403 },
    );
  }

  // 3. Sign up (server client; confirmation email enforced by Auth config).
  const origin = new URL(req.url).origin;
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: `${origin}/auth/callback?next=/dashboard`,
    },
  });
  if (error) {
    // Anti-enumeration: already-registered looks exactly like success.
    if (/already registered/i.test(error.message)) {
      return NextResponse.json({
        ok: true,
        message:
          "Account request received. Check your email to confirm your address, then sign in.",
      });
    }
    return NextResponse.json(
      { error: "Could not create the account. Please try again." },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    message:
      "Account request received. Check your email to confirm your address, then sign in.",
  });
}
