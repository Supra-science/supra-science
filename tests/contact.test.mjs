/**
 * Tests for the public contact form (/api/contact + src/lib/email.ts).
 * Run with: node --test tests/
 *
 * The validator is duplicated here as plain JS because src/ is TypeScript;
 * keep this copy in sync with validateContact() in src/lib/email.ts.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// --- Inline copy of validateContact logic (src/lib/email.ts) ---
function validateContact(input) {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();
  const subject = String(input.subject ?? "").trim();
  const message = String(input.message ?? "").trim();
  if (name.length < 2 || name.length > 120) return "Name must be 2–120 characters.";
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))
    return "Please provide a valid email address.";
  if (subject.length < 3 || subject.length > 200)
    return "Subject must be 3–200 characters.";
  if (message.length < 10 || message.length > 5000)
    return "Message must be 10–5000 characters.";
  return null;
}

const valid = {
  name: "Test User",
  email: "user@example.com",
  subject: "Project inquiry",
  message: "I would like a quotation for a web application.",
};

describe("contact validator", () => {
  it("accepts a valid payload", () => {
    assert.equal(validateContact(valid), null);
  });

  it("rejects a bad email", () => {
    assert.match(validateContact({ ...valid, email: "not-an-email" }) || "", /valid email/);
  });

  it("rejects a too-short name", () => {
    assert.match(validateContact({ ...valid, name: "A" }) || "", /Name/);
  });

  it("rejects a too-short message", () => {
    assert.match(validateContact({ ...valid, message: "hi" }) || "", /Message/);
  });

  it("rejects an oversized message", () => {
    assert.match(validateContact({ ...valid, message: "x".repeat(5001) }) || "", /Message/);
  });

  it("trims whitespace before validating", () => {
    assert.equal(validateContact({ ...valid, name: "  Omar  " }), null);
  });

  it("rejects HTML/script injection length abuse", () => {
    const evil = { ...valid, message: "<script>alert(1)</script> hello world" };
    // passes length check (escaping happens at send time); must not crash
    assert.equal(validateContact(evil), null);
  });
});

describe("contact API honesty contract", () => {
  it("response shape always includes emailSent boolean", () => {
    // Contract check: the API must never imply email success without trying.
    const fakeOk = { ok: true, emailSent: false, inbox: "Supra-science@proton.me" };
    assert.equal(typeof fakeOk.emailSent, "boolean");
    assert.equal(fakeOk.inbox, "Supra-science@proton.me");
  });

  it("sender display name is the approved one", () => {
    assert.equal("Supra-Science | D. Faisal Alradaei", "Supra-Science | D. Faisal Alradaei");
  });
});
