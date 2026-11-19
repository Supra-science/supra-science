/**
 * Tests for the customer platform additions (chat UI backend contract,
 * architecture generator, WhatsApp outbound lib).
 * Run with: node --test tests/
 * Uses Node's built-in test runner (no extra dependencies).
 *
 * NOTE: like the existing suite, pure logic is tested via documented inline
 * copies because the app sources are TypeScript. Each block names its source
 * module so drift can be spotted in review.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// 1. Architecture generator input validation
//    Source: src/app/api/ai/architecture/route.ts (str/optStr + POST checks)
// ---------------------------------------------------------------------------
describe("architecture input validation", () => {
  function str(v, max) {
    if (typeof v !== "string") return null;
    const t = v.trim();
    if (!t || t.length > max) return null;
    return t;
  }

  it("rejects missing/short title and goals", () => {
    assert.equal(str("", 120), null);
    assert.equal(str("ab", 120), "ab"); // length floor enforced by caller (>=3)
    assert.equal(str("x".repeat(121), 120), null);
    assert.equal(str("  Valid title  ", 120), "Valid title");
  });

  it("enforces brief field caps", () => {
    assert.equal(str("x".repeat(2001), 2000), null);
    assert.equal(str("ok", 2000), "ok");
  });

  it("caller-level floors: title>=3, goals>=10", () => {
    const titleOk = (t) => {
      const s = str(t, 120);
      return !!s && s.length >= 3;
    };
    const goalsOk = (g) => {
      const s = str(g, 2000);
      return !!s && s.length >= 10;
    };
    assert.equal(titleOk("ab"), false);
    assert.equal(titleOk("abc"), true);
    assert.equal(goalsOk("short"), false);
    assert.equal(goalsOk("0123456789"), true);
  });
});

// ---------------------------------------------------------------------------
// 2. Architecture draft shape validation
//    Source: src/app/api/ai/architecture/route.ts (validateDraftShape)
// ---------------------------------------------------------------------------
describe("architecture draft shape validation", () => {
  function strArr(v) {
    return Array.isArray(v) && v.every((x) => typeof x === "string") ? v : null;
  }
  function validateDraftShape(raw) {
    if (!raw || typeof raw !== "object") return null;
    const o = raw;
    const summary = typeof o.summary === "string" ? o.summary.trim() : "";
    const data_flow = typeof o.data_flow === "string" ? o.data_flow.trim() : "";
    const lists = ["components", "integrations", "security", "risks", "assumptions", "phases", "open_questions"].map((k) => strArr(o[k]));
    if (!summary || !data_flow || lists.some((l) => l === null)) return null;
    return { summary, data_flow };
  }

  const good = {
    summary: "s", data_flow: "d",
    components: ["a"], integrations: ["b"], security: ["c"],
    risks: ["d"], assumptions: ["e"], phases: ["f"], open_questions: ["g"],
  };

  it("accepts a well-formed draft", () => {
    assert.ok(validateDraftShape(good));
  });

  it("rejects missing summary/data_flow", () => {
    assert.equal(validateDraftShape({ ...good, summary: "  " }), null);
    assert.equal(validateDraftShape({ ...good, data_flow: "" }), null);
  });

  it("rejects non-string array items or missing lists", () => {
    assert.equal(validateDraftShape({ ...good, risks: ["ok", 42] }), null);
    const rest = { ...good };
    delete rest.phases;
    assert.equal(validateDraftShape(rest), null);
  });

  it("rejects non-objects", () => {
    assert.equal(validateDraftShape(null), null);
    assert.equal(validateDraftShape("json"), null);
    assert.equal(validateDraftShape([1, 2]), null);
  });
});

// ---------------------------------------------------------------------------
// 3. WhatsApp E.164 normalization
//    Source: src/lib/whatsapp.ts (normalizeE164)
// ---------------------------------------------------------------------------
describe("whatsapp E.164 normalization", () => {
  function normalizeE164(raw) {
    const digits = (raw ?? "").replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) {
      throw new Error("Invalid recipient phone number: expected 8-15 digits.");
    }
    return digits;
  }

  it("normalizes common formats", () => {
    assert.equal(normalizeE164("+1 (917) 818-3426"), "19178183426");
    assert.equal(normalizeE164("00967770123456"), "00967770123456".replace(/\D/g, ""));
  });

  it("rejects too-short / too-long / empty", () => {
    assert.throws(() => normalizeE164("123"), /Invalid recipient/);
    assert.throws(() => normalizeE164("1".repeat(16)), /Invalid recipient/);
    assert.throws(() => normalizeE164(""), /Invalid recipient/);
    assert.throws(() => normalizeE164("abc"), /Invalid recipient/);
  });
});

// ---------------------------------------------------------------------------
// 4. WhatsApp send safety: dry-run default + config guard
//    Source: src/lib/whatsapp.ts (getWhatsAppConfig, sendWhatsAppText)
// ---------------------------------------------------------------------------
describe("whatsapp send safety", () => {
  function getWhatsAppConfig(env) {
    const missing = [];
    if (!env.WHATSAPP_ACCESS_TOKEN) missing.push("WHATSAPP_ACCESS_TOKEN");
    if (!env.WHATSAPP_PHONE_NUMBER_ID) missing.push("WHATSAPP_PHONE_NUMBER_ID");
    if (missing.length > 0) throw new Error(`WhatsApp is not configured. Missing: ${missing.join(", ")}`);
    return { accessToken: env.WHATSAPP_ACCESS_TOKEN, phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID };
  }

  async function sendWhatsAppText(to, body, opts = {}, env = {}) {
    if (!body || !body.trim()) throw new Error("Message body is required.");
    if (body.length > 4000) throw new Error("Message body too long");
    const dryRun = opts.dryRun ?? true;
    if (dryRun) return { ok: true, dryRun: true, messageId: null, to };
    getWhatsAppConfig(env); // would throw before any network call
    return { ok: true, dryRun: false, messageId: "wamid.test", to };
  }

  it("dry-run is the default: no network, no messageId", async () => {
    const r = await sendWhatsAppText("19178183426", "hello", {}, {});
    assert.equal(r.dryRun, true);
    assert.equal(r.messageId, null);
    assert.equal(r.ok, true);
  });

  it("explicit dryRun:false without config throws before sending", async () => {
    await assert.rejects(
      sendWhatsAppText("19178183426", "hello", { dryRun: false }, {}),
      /not configured/
    );
  });

  it("rejects empty or oversized bodies", async () => {
    await assert.rejects(sendWhatsAppText("19178183426", "   ", {}, {}), /required/);
    await assert.rejects(sendWhatsAppText("19178183426", "x".repeat(4001), {}, {}), /too long/);
  });

  it("config error message never contains secret values", () => {
    try {
      getWhatsAppConfig({});
      assert.fail("should throw");
    } catch (e) {
      assert.match(e.message, /WHATSAPP_ACCESS_TOKEN/);
      assert.doesNotMatch(e.message, /secret|token=[A-Za-z0-9]/i);
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Chat message validation (client + API contract)
//    Source: dashboard/assistant/chat-client.tsx + api/ai/assistant/route.ts
// ---------------------------------------------------------------------------
describe("chat message validation", () => {
  const MAX_LEN = 4000;
  function validMessage(t) {
    const s = (t ?? "").trim();
    return s.length > 0 && s.length <= MAX_LEN;
  }

  it("accepts normal messages", () => {
    assert.equal(validMessage("Hello, I need a quote."), true);
  });

  it("rejects empty and oversized", () => {
    assert.equal(validMessage("   "), false);
    assert.equal(validMessage("x".repeat(4001)), false);
    assert.equal(validMessage("x".repeat(4000)), true);
  });
});
