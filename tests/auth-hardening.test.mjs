/**
 * Tests for audit findings #3 (RLS policies), #5 (live Supabase check)
 * and #6 (password policy, login hardening, MFA).
 * Run with: node --test tests/
 *
 * Static source assertions (same style as tests/public-site.test.mjs):
 * the code is TypeScript, so the tests read the source instead of
 * importing it. The production RLS policies themselves were verified
 * live (pg_policies + is_admin() checks) when migration 009 was applied.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

function src(rel) {
  return readFileSync(join(SRC, rel), "utf8");
}

describe("finding #5 — Supabase status is a live check", () => {
  it("integrations page runs a live database check for Supabase", () => {
    const code = src("app/admin/integrations/page.tsx");
    assert.match(code, /checkSupabase/, "page must define a live Supabase check");
    assert.match(code, /supabaseCheck\.ok \? "Connected" : "Failed"/, "Supabase status must come from the live check");
    assert.match(code, /getServiceSupabase/, "check must use the service-role client");
    assert.doesNotMatch(code, /status: "Connected",\n\s*detail: `Project URL configured/, "Supabase must not hard-code Connected");
  });
});

describe("finding #6 — password policy is 12 everywhere", () => {
  it("arabic signup requires 12 characters", () => {
    const code = src("app/ar/signup/page.tsx");
    assert.match(code, /minLength=\{12\}/, "ar/signup minLength must be 12");
    assert.match(code, /12 حرف/, "ar/signup label must say 12");
    assert.doesNotMatch(code, /minLength=\{8\}/, "no 8-char minimum may remain in ar/signup");
  });

  it("english signup and reset already require 12", () => {
    assert.match(src("app/signup/page.tsx"), /minLength=\{12\}/, "en signup must be 12");
    assert.match(src("app/reset-password/page.tsx"), /minLength=\{12\}/, "reset-password must be 12");
  });

  it("password change enforces 12 and the message says 12", () => {
    assert.match(src("components/password-change.tsx"), /pw\.length < 12/, "password change must check 12");
    assert.match(src("lib/i18n.ts"), /passwordTooShort: \{ ar: "[^"]*12 حرف/, "arabic message must say 12");
    assert.match(src("lib/i18n.ts"), /en: "Password must be at least 12 characters\."/, "english message must say 12");
  });
});

describe("finding #6 — login goes through a hardened server route", () => {
  it("login route rate-limits, verifies reCAPTCHA and checks MFA", () => {
    const code = src("app/api/auth/login/route.ts");
    assert.match(code, /isRateLimited\(`login:ip:/, "login route must rate-limit per IP");
    assert.match(code, /isRateLimited\(`login:email:/, "login route must rate-limit per email");
    assert.match(code, /verifyRecaptcha\(recaptchaToken, "login"/, "login route must verify reCAPTCHA action login");
    assert.match(code, /signInWithPassword/, "login route must sign in server-side");
    assert.match(code, /getAuthenticatorAssuranceLevel/, "login route must check AAL for MFA");
    assert.match(code, /mfa_required: true/, "login route must return mfa_required for enrolled accounts");
  });

  it("mfa-verify route challenges, verifies and rate-limits", () => {
    const code = src("app/api/auth/mfa-verify/route.ts");
    assert.match(code, /mfa\.challenge/, "mfa-verify must challenge");
    assert.match(code, /mfa\.verify/, "mfa-verify must verify the code");
    assert.match(code, /isRateLimited\(`mfa:/, "mfa-verify must rate-limit per user");
  });

  it("both login pages use the route and never sign in directly", () => {
    for (const p of ["app/login/page.tsx", "app/ar/login/page.tsx"]) {
      const code = src(p);
      assert.match(code, /fetch\("\/api\/auth\/login"/, `${p} must call the login route`);
      assert.match(code, /getRecaptchaToken\("login"\)/, `${p} must mint a login reCAPTCHA token`);
      assert.match(code, /mfa_required/, `${p} must handle the MFA step`);
      assert.doesNotMatch(code, /signInWithPassword/, `${p} must not sign in directly from the browser`);
    }
  });
});

describe("auth hardening 2026-11-18 — Google OAuth + server-side signup", () => {
  it("all four auth pages offer Google sign-in via Supabase OAuth", () => {
    for (const p of [
      "app/login/page.tsx",
      "app/ar/login/page.tsx",
      "app/signup/page.tsx",
      "app/ar/signup/page.tsx",
    ]) {
      const code = src(p);
      assert.match(code, /signInWithOAuth\(\{\s*provider:\s*"google"/, `${p} must offer Google OAuth`);
      assert.match(code, /\/auth\/callback\?next=\/dashboard/, `${p} must redirect OAuth to /auth/callback`);
    }
  });

  it("signup goes through a hardened server route", () => {
    const code = src("app/api/auth/signup/route.ts");
    assert.match(code, /isRateLimited\(`signup:ip:/, "signup route must rate-limit per IP");
    assert.match(code, /isRateLimited\(`signup:email:/, "signup route must rate-limit per email");
    assert.match(code, /verifyRecaptcha\(recaptchaToken, "signup"/, "signup route must verify reCAPTCHA action signup");
    assert.match(code, /MIN_PASSWORD_LENGTH = 12/, "signup route must define a 12-char minimum");
    assert.match(code, /password\.length < MIN_PASSWORD_LENGTH/, "signup route must enforce 12 server-side");
    assert.match(code, /already registered/i, "signup route must not enumerate existing emails");
    assert.match(code, /\.auth\.signUp\(/, "signup route must sign up server-side");
  });

  it("both signup pages use the route and never sign up directly", () => {
    for (const p of ["app/signup/page.tsx", "app/ar/signup/page.tsx"]) {
      const code = src(p);
      assert.match(code, /fetch\("\/api\/auth\/signup"/, `${p} must call the signup route`);
      assert.match(code, /getRecaptchaToken\("signup"\)/, `${p} must mint a signup reCAPTCHA token`);
      assert.match(code, /minLength=\{12\}/, `${p} must keep the 12-char minimum`);
      assert.doesNotMatch(code, /\.auth\.signUp\(/, `${p} must not sign up directly from the browser`);
    }
  });
});

describe("finding #6 — MFA enrollment and admin AAL2 enforcement", () => {
  it("enrollment component exists and the dashboard renders it", () => {
    const comp = src("components/mfa-enrollment.tsx");
    assert.match(comp, /mfa\.enroll\(\{ factorType: "totp" \}\)/, "component must enroll TOTP");
    assert.match(comp, /mfa\.verify/, "component must verify the enrollment code");
    assert.match(comp, /mfa\.unenroll/, "component must allow unenrollment");
    assert.match(src("app/dashboard/page.tsx"), /<MfaEnrollment lang=\{lang\} \/>/, "dashboard must render the enrollment component");
  });

  it("admin guards require AAL2 for MFA-enrolled admins", () => {
    assert.match(src("lib/admin-auth.ts"), /hasCompletedMfa/, "requireAdmin must check MFA completion");
    assert.match(src("lib/admin-auth.ts"), /nextLevel === "aal2"/, "admin-auth must compare against aal2");
    assert.match(src("lib/admin-page.ts"), /hasCompletedMfa/, "requireAdminPage must check MFA completion");
  });
});

describe("finding #3 — RLS migration 009 (record + shape)", () => {
  const MIG = join(ROOT, "supabase/migrations/009_rls_admin_and_owner_policies.sql");

  it("migration file exists and defines is_admin()", () => {
    assert.ok(existsSync(MIG), "migration 009 must exist in the tree");
    const sql = readFileSync(MIG, "utf8");
    assert.match(sql, /create or replace function public\.is_admin\(\)/, "migration must define is_admin()");
    assert.match(sql, /role = 'admin'/, "is_admin must check the admin role");
  });

  it("migration creates 11 policies: 8 admin + 3 owner", () => {
    const sql = readFileSync(MIG, "utf8");
    const created = sql.match(/^create policy /gim) || [];
    assert.equal(created.length, 11, `migration must create 11 policies, found ${created.length}`);
    for (const t of [
      "ai_conversations", "ai_messages", "audit_logs", "consultation_bookings",
      "contact_messages", "invoices", "whatsapp_conversations", "whatsapp_messages",
    ]) {
      assert.ok(sql.includes(`Admins can manage ${t}`) || sql.includes(`Admins can view ${t}`), `migration must cover ${t}`);
    }
    assert.match(sql, /Users can manage own ai_conversations/, "owner policy for ai_conversations");
    assert.match(sql, /Users can manage messages of own ai_conversations/, "owner policy for ai_messages");
    assert.match(sql, /Users can view own invoices/, "owner policy for invoices");
    assert.doesNotMatch(sql, /drop table|delete from|truncate/i, "migration must not delete data or tables");
  });
});
