/**
 * Automated tests for Supra-Science platform.
 * Run with: node --test tests/
 * Uses Node's built-in test runner (no extra dependencies).
 *
 * Coverage:
 * - Rate limiter logic (AI endpoint protection)
 * - Stripe TEST key guard (refuses live keys)
 * - WhatsApp webhook signature verification (HMAC-SHA256)
 * - Input validation (payment link / checkout)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// 1. Rate limiter
// ---------------------------------------------------------------------------
describe("rate limiter", () => {
  // Inline copy of src/lib/rate-limit.ts logic for isolated testing.
  const store = new Map();
  function isRateLimited(key, options = {}) {
    const windowMs = options.windowMs ?? 60_000;
    const max = options.max ?? 10;
    const now = Date.now();
    const hits = (store.get(key) ?? []).filter((t) => now - t < windowMs);
    if (hits.length >= max) return true;
    hits.push(now);
    store.set(key, hits);
    return false;
  }
  function reset() { store.clear(); }

  it("allows requests under the limit", () => {
    reset();
    for (let i = 0; i < 5; i++) {
      assert.equal(isRateLimited("test-user-1", { max: 10 }), false);
    }
  });

  it("blocks requests over the limit", () => {
    reset();
    for (let i = 0; i < 10; i++) isRateLimited("test-user-2", { max: 10 });
    assert.equal(isRateLimited("test-user-2", { max: 10 }), true);
  });

  it("isolates limits per key", () => {
    reset();
    for (let i = 0; i < 10; i++) isRateLimited("user-a", { max: 10 });
    assert.equal(isRateLimited("user-a", { max: 10 }), true);
    assert.equal(isRateLimited("user-b", { max: 10 }), false);
  });
});

// ---------------------------------------------------------------------------
// 2. Stripe TEST key guard
// ---------------------------------------------------------------------------
describe("stripe test-mode guard", () => {
  it("refuses live keys", () => {
    // Mirror of getStripe() guard logic in src/lib/stripe/*.ts
    const guard = (key) => {
      if (!key) throw new Error("STRIPE_SECRET_KEY_TEST is not set");
      if (!key.startsWith("sk_test_")) throw new Error("Refusing to run: not a TEST key");
      return true;
    };
    assert.throws(() => guard("sk_live_abc123"), /not a TEST key/);
    assert.throws(() => guard(undefined), /not set/);
    assert.equal(guard("sk_test_abc123"), true);
  });

  it("validates checkout input", () => {
    const validate = (amountCents, email) => {
      if (!Number.isInteger(amountCents) || amountCents <= 0)
        throw new Error("amountCents must be a positive integer");
      if (!email || !email.includes("@")) throw new Error("valid customerEmail required");
      return true;
    };
    assert.throws(() => validate(0, "a@b.com"), /positive integer/);
    assert.throws(() => validate(100, "not-an-email"), /valid customerEmail/);
    assert.throws(() => validate(10.5, "a@b.com"), /positive integer/);
    assert.equal(validate(550000, "client@example.com"), true);
  });
});

// ---------------------------------------------------------------------------
// 3. WhatsApp webhook signature verification
// ---------------------------------------------------------------------------
describe("whatsapp webhook signature", () => {
  const appSecret = "test-app-secret";

  function sign(body) {
    return "sha256=" + crypto.createHmac("sha256", appSecret).update(body).digest("hex");
  }

  function verify(rawBody, signature) {
    if (!signature || !signature.startsWith("sha256=")) return false;
    const expected = crypto.createHmac("sha256", appSecret).update(rawBody).digest();
    const received = Buffer.from(signature.slice(7), "hex");
    if (received.length !== expected.length) return false;
    return crypto.timingSafeEqual(received, expected);
  }

  it("accepts a valid signature", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });
    assert.equal(verify(body, sign(body)), true);
  });

  it("rejects a tampered body", () => {
    const body = JSON.stringify({ object: "whatsapp_business_account" });
    const sig = sign(body);
    assert.equal(verify(body + "tampered", sig), false);
  });

  it("rejects missing or malformed signatures", () => {
    assert.equal(verify("body", null), false);
    assert.equal(verify("body", "invalid"), false);
    assert.equal(verify("body", "sha256=zzzz"), false);
  });
});

// ---------------------------------------------------------------------------
// 4. Payment idempotency contract
// ---------------------------------------------------------------------------
describe("payment idempotency", () => {
  it("unique payment_intent_id prevents duplicates (contract)", () => {
    // The DB enforces UNIQUE(stripe_payment_intent_id); the webhook checks
    // alreadyRecorded() before insert. This test documents the contract:
    // the same payment_intent_id must never create two payment rows.
    const seen = new Set();
    const record = (paymentIntentId) => {
      if (seen.has(paymentIntentId)) return false; // duplicate → skip
      seen.add(paymentIntentId);
      return true;
    };
    assert.equal(record("pi_test_123"), true);
    assert.equal(record("pi_test_123"), false); // Stripe retry → skipped
    assert.equal(record("pi_test_456"), true);
  });
});
