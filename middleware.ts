import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { updateSession } from "@/lib/supabase/proxy";
import { hasPermission } from "@/lib/permissions";

/**
 * Language-first middleware.
 *
 * Recovered from the live Nov-8 deployment bundle (middleware chunk):
 * the 13 public paths below are served in Arabic by default. When the
 * `ss-lang` cookie is not exactly "en", the visitor is redirected to the
 * `/ar…` version with a permanent 301 (root → `/ar` since 2026-11-19,
 * audit finding L10; all other locale redirects 301 since 2026-11-19,
 * fix 2). The redirect carries `Vary: Cookie` so a later language
 * choice is still honoured. Verified live after the next deploy.
 *
 * Every other request gets an `x-pathname` header (used by the 404 page
 * to render the right language) and continues to the Supabase session
 * update. Auth, dashboard, admin, /ar/* and /api/* paths are not
 * redirected.
 *
 * Added 2026-11-13 (audit findings #7, #9):
 * - Central admin guard for /admin/* and /api/admin/* (second defense
 *   behind the per-page/route guards).
 * - Per-request CSP nonce (x-nonce request header for Next.js, CSP
 *   response header for the browser). The CSP itself moved here from
 *   next.config.ts because a nonce must be fresh on every request.
 */
const AR_FIRST_PATHS = new Set([
  "/",
  "/services",
  "/about",
  "/process",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
  "/signup",
  "/forgot-password",
  "/start",
  "/book",
]);

/**
 * Central admin guard — returns a redirect/401/403 response when the
 * caller may not access an admin path, or null when access is allowed
 * (the page/route guards still run as the primary check).
 * Pages redirect (/login when signed out, /dashboard when signed in
 * but not an admin); API routes get JSON errors instead.
 * If Supabase is not configured, the guard cannot verify and returns
 * null — the per-page/route guards remain the enforcement then.
 */
async function checkAdminAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      // Read-only here: updateSession() runs right after and persists
      // any session refresh properly.
      setAll: () => {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isApi = request.nextUrl.pathname.startsWith("/api/admin/");
  if (!user) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!(await hasPermission(supabase, user, "admin:access"))) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return null;
}

/**
 * Central staff guard (added 2026-11-20, staff permissions build) —
 * same shape as checkAdminAccess but allows staff OR admin (admin is a
 * superset of staff). Second defense behind the per-page/route guards
 * for /staff/* and /api/staff/*.
 */
async function checkStaffAccess(
  request: NextRequest,
): Promise<NextResponse | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: () => {},
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isApi = request.nextUrl.pathname.startsWith("/api/staff/");
  if (!user) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (!(await hasPermission(supabase, user, "staff:access"))) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return null;
}

/**
 * Content-Security-Policy with a per-request nonce.
 * - script-src: no 'unsafe-inline', no 'unsafe-eval' (none used in src);
 *   'strict-dynamic' lets nonce-trusted scripts (incl. the reCAPTCHA
 *   loader) load their own dependencies; google.com/gstatic.com stay as
 *   a fallback for browsers without strict-dynamic support.
 * - Stripe domains removed (Stripe was removed from the platform).
 * - object-src 'none', base-uri 'self', form-action 'self' added.
 * - style-src keeps 'unsafe-inline': Next.js injects its own styles and
 *   removing it would break rendering; styles are lower-risk than scripts.
 */
function cspHeader(nonce: string): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://www.google.com https://www.gstatic.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https://ityzbuncztwgtxudcobr.supabase.co https://www.google.com",
    "frame-src https://www.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Canonical-domain 301 (founder decision, 2026-11-18): the old
  // supra-science.supra-science.workers.dev host redirects permanently to
  // suprascience.dpdns.org so Google consolidates the two indexed pages.
  // - Auth routes are excluded so the OAuth dance never breaks.
  // - Requests carrying a live Supabase session cookie are left alone so
  //   current signed-in sessions on the old host keep working.
  // - Only GET/HEAD are redirected (a 301 would drop a POST body).
  if (
    request.headers.get("host") ===
      "supra-science.supra-science.workers.dev" &&
    (request.method === "GET" || request.method === "HEAD")
  ) {
    const isAuthRoute =
      pathname === "/auth/callback" ||
      pathname.startsWith("/auth/callback/") ||
      pathname.startsWith("/api/auth/");
    const hasSession = request.cookies
      .getAll()
      .some((c) => c.name.startsWith("sb-") && c.name.includes("auth-token"));
    if (!isAuthRoute && !hasSession) {
      const url = request.nextUrl.clone();
      url.protocol = "https:";
      url.host = "suprascience.dpdns.org";
      return NextResponse.redirect(url, 301);
    }
  }

  // Central admin guard first (finding #7).
  if (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/")
  ) {
    const denied = await checkAdminAccess(request);
    if (denied) return denied;
  }

  // Central staff guard (added 2026-11-20): /staff and /api/staff allow
  // staff or admin; customers are redirected to /dashboard.
  if (
    pathname === "/staff" ||
    pathname.startsWith("/staff/") ||
    pathname.startsWith("/api/staff/")
  ) {
    const denied = await checkStaffAccess(request);
    if (denied) return denied;
  }

  if (
    AR_FIRST_PATHS.has(pathname) &&
    request.cookies.get("ss-lang")?.value !== "en"
  ) {
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? "/ar" : `/ar${pathname}`;
    // Fix 2 (2026-11-19, audit L10 extension): every locale redirect is
    // permanent (301) — the move to the /ar twin is permanent, not
    // temporary — so Google consolidates signals on the final URL.
    // `Vary: Cookie` keeps a later language choice honoured: the 301 is
    // cached per cookie state, so a visitor who later chooses English
    // (ss-lang=en) is not served the cached redirect to /ar.
    const res = NextResponse.redirect(url, 301);
    res.headers.set("Vary", "Cookie");
    return res;
  }

  // Per-request CSP nonce (finding #9). Next.js reads x-nonce and adds
  // the attribute to the scripts it renders; the CSP header enforces it.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const headers = new Headers(request.headers);
  headers.set("x-pathname", pathname);
  headers.set("x-nonce", nonce);

  // /en and /en/* (added 2026-11-13, audit finding #2): real English
  // URLs served by src/app/en/*. Persist the choice in the ss-lang
  // cookie (same attributes as /api/lang) so later navigation to
  // cookie-driven root paths stays English. No redirect here.
  if (pathname === "/en" || pathname.startsWith("/en/")) {
    const res = await updateSession(new NextRequest(request, { headers }));
    res.cookies.set("ss-lang", "en", {
      path: "/",
      maxAge: 31_536_000,
      sameSite: "lax",
    });
    res.headers.set("Content-Security-Policy", cspHeader(nonce));
    return res;
  }
  const res = await updateSession(new NextRequest(request, { headers }));
  res.headers.set("Content-Security-Policy", cspHeader(nonce));
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
