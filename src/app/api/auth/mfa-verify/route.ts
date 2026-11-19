// src/app/api/auth/mfa-verify/route.ts — complete TOTP verification (added 2026-11-13, audit finding #6).
//
// POST { factorId, code } — for a session that signed in at AAL1 and must
// reach AAL2 (see /api/auth/login). Rate-limited per user (5 attempts /
// 15 min) so the 6-digit code cannot be brute-forced. On success the
// session cookies are upgraded to AAL2 by the SSR client.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isRateLimited } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const factorId = typeof body.factorId === "string" ? body.factorId : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!factorId || !/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "A 6-digit verification code is required." },
      { status: 400 },
    );
  }

  if (isRateLimited(`mfa:${user.id}`, { windowMs: 15 * 60_000, max: 5 })) {
    return NextResponse.json(
      { error: "Too many verification attempts. Please wait 15 minutes and try again." },
      { status: 429 },
    );
  }

  const { data: challenge, error: challengeError } =
    await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) {
    return NextResponse.json(
      { error: "Could not start verification. Please sign in again." },
      { status: 400 },
    );
  }

  const { error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code,
  });
  if (error) {
    return NextResponse.json(
      { error: "Invalid verification code." },
      { status: 401 },
    );
  }

  return NextResponse.json({ ok: true });
}
