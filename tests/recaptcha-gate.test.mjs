/**
 * Tests for the reCAPTCHA fail-closed gate + /en routing (audit findings #1, #2).
 * Run with: node --test tests/
 *
 * These are static source assertions (same style as tests/public-site.test.mjs):
 * the verifier and its call sites are TypeScript, so the tests read the
 * source instead of importing it.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

function src(rel) {
  return readFileSync(join(SRC, rel), "utf8");
}

describe("reCAPTCHA fail-closed gate (audit #1)", () => {
  const lib = src("lib/recaptcha.ts");

  it("verifier checks the expected action and reports action_mismatch", () => {
    assert.match(lib, /expectedAction/, "verifyRecaptcha must take an expected action");
    assert.match(lib, /action_mismatch/, "verifier must report action_mismatch");
    assert.match(lib, /data\.action/, "verifier must read data.action from siteverify");
  });

  it("verifier has no gate-skipped path", () => {
    assert.doesNotMatch(lib, /reason !== "not_configured"/, "no not_configured exemption may remain");
    assert.doesNotMatch(lib, /gate skipped"/, "no gate-skipped behaviour may remain");
    assert.match(lib, /fail-closed/i, "fail-closed contract must be documented");
  });

  it("all three public routes reject on any unverified result", () => {
    for (const route of [
      "app/api/contact/route.ts",
      "app/api/bookings/route.ts",
      "app/api/ai/public-assistant/route.ts",
    ]) {
      const code = src(route);
      assert.match(code, /if \(!recaptcha\.verified\)/, `${route} must gate on !verified alone`);
      assert.doesNotMatch(code, /not_configured/, `${route} must not exempt not_configured`);
    }
  });

  it("contact route accepts the intake wizard action", () => {
    const code = src("app/api/contact/route.ts");
    assert.match(code, /\["contact", "intake"\]/, "contact must accept contact + intake actions");
  });

  it("booking and assistant routes each expect their own action", () => {
    assert.match(src("app/api/bookings/route.ts"), /"booking"/, "bookings must expect action booking");
    assert.match(
      src("app/api/ai/public-assistant/route.ts"),
      /"public_assistant"/,
      "assistant must expect action public_assistant",
    );
  });
});

describe("English URL twins /en/* (audit #2)", () => {
  it("middleware serves /en without redirect and persists the choice", () => {
    const code = readFileSync(join(ROOT, "middleware.ts"), "utf8");
    assert.match(code, /pathname === "\/en"/, "middleware must handle /en");
    assert.match(code, /pathname\.startsWith\("\/en\/"\)/, "middleware must handle /en/*");
    assert.match(code, /res\.cookies\.set\("ss-lang", "en"/, "middleware must set the ss-lang cookie");
  });

  it("getLang honours the /en and /ar URL prefixes", () => {
    const code = src("lib/lang-server.ts");
    assert.match(code, /x-pathname/, "getLang must read the x-pathname header");
    assert.match(code, /pathname\.startsWith\("\/en\/"\)/, "getLang must return en for /en/*");
  });

  it("every /en twin re-exports its root page with /en metadata", () => {
    for (const p of [
      "en/page.tsx",
      "en/services/page.tsx",
      "en/about/page.tsx",
      "en/process/page.tsx",
      "en/faq/page.tsx",
      "en/contact/page.tsx",
      "en/start/page.tsx",
      "en/book/page.tsx",
      "en/privacy/page.tsx",
      "en/terms/page.tsx",
    ]) {
      const code = src(`app/${p}`);
      assert.match(code, /export const metadata/, `${p} missing metadata export`);
      assert.match(code, /canonical:\s*"\/en/, `${p} canonical must be /en/...`);
      assert.match(code, /export \{ default \} from/, `${p} must re-export the root page`);
    }
  });
});
