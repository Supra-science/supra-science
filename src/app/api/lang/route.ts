import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/lang?to=en|ar&next=/path
 *
 * Language switcher. Sets the `ss-lang` cookie ("en" or "ar"; anything
 * other than exactly "en" becomes "ar") and redirects to `next`
 * (only a same-site path is honoured — anything else falls back to "/").
 *
 * Cookie: path=/, maxAge 31536000 (1 year), sameSite=lax.
 * (Reconstructed from the Nov-8 live bundle, userland module 75232.)
 */
export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to");
  const requestedNext = req.nextUrl.searchParams.get("next") || "/";
  const next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/";
  const res = NextResponse.redirect(new URL(next, req.url));
  res.cookies.set("ss-lang", to === "en" ? "en" : "ar", {
    path: "/",
    maxAge: 31_536_000,
    sameSite: "lax",
  });
  return res;
}
