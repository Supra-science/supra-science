/**
 * Server-side language helper.
 *
 * Recovered from the live Nov-8 deployment bundle (module 53410, shared
 * chunk with the i18n dictionary module 5685). New in Nov-8; the Nov-5
 * base has no language helper at all.
 *
 * Language is stored in the `ss-lang` cookie. `getLang()` returns "en"
 * only when the cookie is exactly "en" — Arabic is the default.
 * Translation helpers (t, formatDate, roleLabel, statusLabel) live in
 * `@/lib/i18n`.
 */

import { cookies, headers } from "next/headers";
import type { Lang } from "@/lib/i18n";

export const LANG_COOKIE = "ss-lang";

/** Language for the current request.
 *
 * URL prefix wins (set by the middleware as the `x-pathname` header):
 * "/en" or "/en/*" is English, "/ar" or "/ar/*" is Arabic. Otherwise
 * "en" only when the ss-lang cookie is exactly "en"; anything else
 * (including no cookie) is Arabic. Added 2026-11-13 with the /en/*
 * routes (audit finding #2) so English pages render English on the
 * first request, before any cookie exists. */
export async function getLang(): Promise<Lang> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (pathname === "/en" || pathname.startsWith("/en/")) return "en";
  if (pathname === "/ar" || pathname.startsWith("/ar/")) return "ar";
  return (await cookies()).get(LANG_COOKIE)?.value === "en" ? "en" : "ar";
}
