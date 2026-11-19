/**
 * Tests for audit findings #7 (central admin guard), #8 (HSTS) and
 * #9 (CSP hardening). Static source assertions, same style as the
 * other tests in this folder. Run with: node --test tests/
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

function src(rel) {
  return readFileSync(join(SRC, rel), "utf8");
}
function root(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("finding #7 — central admin guard", () => {
  it("middleware guards /admin and /api/admin paths", () => {
    const mw = root("middleware.ts");
    assert.match(mw, /checkAdminAccess/, "middleware must define the central guard");
    assert.match(mw, /pathname === "\/admin"/, "guard must cover /admin");
    assert.match(mw, /pathname\.startsWith\("\/admin\/"\)/, "guard must cover /admin/*");
    assert.match(mw, /pathname\.startsWith\("\/api\/admin\/"\)/, "guard must cover /api/admin/*");
    assert.match(mw, /isAdminUser\(supabase, user\)/, "guard must verify the admin identity");
  });

  it("middleware returns 401/403 JSON for API routes, redirects for pages", () => {
    const mw = root("middleware.ts");
    assert.match(mw, /status: 401/, "API guard must return 401 when signed out");
    assert.match(mw, /status: 403/, "API guard must return 403 when not an admin");
    assert.match(mw, /new URL\("\/login"/, "page guard must redirect signed-out visitors to /login");
    assert.match(mw, /new URL\("\/dashboard"/, "page guard must redirect non-admins to /dashboard");
  });

  it("admin layout guards the whole section before rendering the nav", () => {
    const layout = src("app/admin/layout.tsx");
    assert.match(layout, /requireAdminPage\(\)/, "admin layout must call requireAdminPage()");
    assert.match(layout, /import \{ requireAdminPage \} from "@\/lib\/admin-page"/, "layout must import the guard");
  });

  it("ADMIN_EMAILS has one source of truth", () => {
    const shared = src("lib/admin-check.ts");
    assert.match(shared, /export const ADMIN_EMAILS = \["Supra-science@proton\.me"\]/, "admin-check must hold the allowlist");
    assert.match(shared, /export async function isAdminUser/, "admin-check must export isAdminUser");
    for (const f of ["lib/admin-auth.ts", "lib/admin-page.ts"]) {
      const code = src(f);
      assert.match(code, /isAdminUser/, `${f} must use the shared helper`);
      assert.doesNotMatch(code, /const ADMIN_EMAILS/, `${f} must not define its own ADMIN_EMAILS`);
    }
  });
});

describe("finding #8 — HSTS", () => {
  it("next.config.ts sets Strict-Transport-Security, 1 year, subdomains", () => {
    const cfg = root("next.config.ts");
    // Match the header value itself (the file's comments also mention
    // preload, which must NOT be in the value).
    assert.match(cfg, /\{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" \}/, "HSTS must be exactly 1 year with includeSubDomains, no preload");
  });
});

describe("finding #9 — CSP hardening", () => {
  it("CSP lives in middleware with a per-request nonce", () => {
    const mw = root("middleware.ts");
    assert.match(mw, /cspHeader\(nonce\)/, "middleware must build the CSP from a nonce");
    assert.match(mw, /x-nonce/, "middleware must pass the nonce to Next.js via x-nonce");
    assert.match(mw, /Content-Security-Policy/, "middleware must set the CSP response header");
    assert.match(mw, /'nonce-\$\{nonce\}' 'strict-dynamic'/, "script-src must use nonce + strict-dynamic");
  });

  // Assertions run on the cspHeader function body only: the file's
  // comments name the removed tokens (unsafe-eval, Stripe), so a
  // whole-file match would be a false positive.
  const cspFn = (() => {
    const mw = root("middleware.ts");
    return mw.slice(mw.indexOf("function cspHeader"), mw.indexOf("export async function middleware"));
  })();

  it("CSP has no unsafe-eval, no Stripe domains, and the new directives", () => {
    assert.doesNotMatch(cspFn, /unsafe-eval/, "CSP must not contain unsafe-eval");
    assert.doesNotMatch(cspFn, /stripe\.com/, "CSP must not contain any Stripe domain");
    const scriptSrc = cspFn.match(/script-src [^"]+/)[0];
    assert.doesNotMatch(scriptSrc, /unsafe-inline/, "script-src must not contain unsafe-inline");
    assert.match(cspFn, /object-src 'none'/, "CSP must set object-src 'none'");
    assert.match(cspFn, /base-uri 'self'/, "CSP must set base-uri 'self'");
    assert.match(cspFn, /form-action 'self'/, "CSP must set form-action 'self'");
  });

  it("CSP is not also set in next.config.ts (two CSP headers would both apply)", () => {
    const cfg = root("next.config.ts");
    // Match the header key (the file's note mentions the CSP name).
    assert.doesNotMatch(cfg, /key: "Content-Security-Policy"/, "next.config.ts must not set a CSP header anymore");
  });

  it("no eval/new Function anywhere in src (unsafe-eval is safe to remove)", () => {
    const bad = [];
    const walk = (dir) => {
      for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(name)) {
          const code = readFileSync(p, "utf8");
          if (/\beval\s*\(|new Function\s*\(/.test(code)) bad.push(p);
        }
      }
    };
    walk(SRC);
    assert.deepEqual(bad, [], `eval/new Function found in: ${bad.join(", ")}`);
  });
});
