/**
 * Guards for the WhatsApp Business catalog section + illustrative samples.
 * Run with: node --test tests/
 *
 * The catalog mirrors the owner's approved Muse-space section (cards
 * SS-01..SS-05, four ordering steps, one hypothetical sample per
 * service). Guards: exactly five items, no invented prices anywhere in
 * the catalog data, samples clearly labelled hypothetical, SS-04 states
 * the prototypes are not certified medical devices, and the section is
 * wired into both Services pages with a nav link.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIB = readFileSync(join(ROOT, "src", "lib", "whatsapp-catalog.ts"), "utf8");
const COMP = readFileSync(join(ROOT, "src", "components", "whatsapp-catalog.tsx"), "utf8");
const CHROME = readFileSync(join(ROOT, "src", "components", "site-chrome.tsx"), "utf8");

function section(src, marker) {
  const i = src.indexOf(marker);
  assert.ok(i >= 0, `missing ${marker}`);
  return src.slice(i);
}

describe("whatsapp catalog data", () => {
  it("has exactly five items, codes SS-01..SS-05 in order (AR then EN)", () => {
    const codes = [...LIB.matchAll(/code: "(SS-\d{2})"/g)].map((m) => m[1]);
    assert.deepEqual(codes, ["SS-01", "SS-02", "SS-03", "SS-04", "SS-05", "SS-01", "SS-02", "SS-03", "SS-04", "SS-05"]);
  });

  it("has five samples per language", () => {
    // Each sample object starts with a title line inside SAMPLES.
    const sampleTitles = [...LIB.matchAll(/title: "(?:[^"]*— تصوّر افتراضي|[^"]*— a hypothetical scenario)"/g)];
    assert.equal(sampleTitles.length, 10, `expected 10 samples (5 AR + 5 EN), got ${sampleTitles.length}`);
  });

  it("contains no invented prices", () => {
    assert.doesNotMatch(LIB, /\$\s?\d/, "catalog data must not contain a price figure");
    assert.doesNotMatch(LIB, /3,500|4,500|6,500|1,500/, "catalog data must not repeat the service starting prices");
    assert.ok(LIB.includes("Quoted after a scope review"));
    assert.ok(LIB.includes("يُحدَّد بعرض سعر بعد دراسة النطاق"));
  });

  it("SS-04 sample states the prototypes are not certified medical devices", () => {
    assert.ok(LIB.includes("not a certified medical device"));
    assert.ok(LIB.includes("ليس جهازاً طبياً معتمداً"));
  });

  it("labels every sample hypothetical, never as client work", () => {
    assert.ok(LIB.includes("Hypothetical illustrative sample"));
    assert.ok(LIB.includes("نموذج توضيحي افتراضي"));
    assert.ok(LIB.includes("not completed client projects"));
    assert.ok(LIB.includes("ليست مشاريع عملاء منجزة"));
    // The disclaimer negates completion ("not a completed client project")
    // — that wording is required, not a claim of completed work.
    assert.ok(LIB.includes("not a completed client project"));
  });

  it("has four ordering steps per language", () => {
    const ar = section(LIB, "export const CAT_STEPS");
    const steps = [...ar.matchAll(/"((?:تصفّح|اختر|اضغط|نرد)[^"]*)"/g)];
    assert.ok(steps.length >= 4, `expected 4 AR steps, got ${steps.length}`);
    assert.ok(ar.includes("Browse the catalog items prepared for WhatsApp Business"));
  });
});

describe("whatsapp catalog component", () => {
  it("links the official catalog and the business number", () => {
    assert.ok(COMP.includes("https://wa.me/c/19178183426"), "catalog link missing");
    assert.ok(COMP.includes("WHATSAPP_NUMBER"), "must use the shared WhatsApp number constant");
    assert.ok(COMP.includes("wa.me/c/19178183426 · "), "catalog address line missing");
  });

  it("builds a pre-filled per-item WhatsApp request link", () => {
    assert.ok(COMP.includes("?text=${waText}"), "per-item wa.me prefilled link missing");
    assert.ok(COMP.includes("cat_wa_intro") || COMP.includes("waIntro"), "prefill intro missing");
  });

  it("renders the badge and the general notice on every sample", () => {
    assert.ok(COMP.includes("sampleBadge"), "sample badge missing");
    assert.ok(COMP.includes('role="note"'), "general sample notice missing");
    assert.ok(COMP.includes("disclaimer"), "per-sample disclaimer missing");
  });

  it("anchors the catalog section and links cards back to service details", () => {
    assert.ok(COMP.includes('id="catalog"'), "catalog anchor missing");
    assert.ok(COMP.includes("href={`#${service.id}`}"), "details anchor missing");
  });
});

describe("whatsapp catalog wiring", () => {
  for (const p of ["src/app/services/page.tsx", "src/app/ar/services/page.tsx"]) {
    it(`${p} renders the catalog section`, () => {
      const src = readFileSync(join(ROOT, p), "utf8");
      assert.ok(src.includes("WhatsAppCatalog"), `${p} does not import WhatsAppCatalog`);
      assert.ok(src.includes("<WhatsAppCatalog"), `${p} does not render WhatsAppCatalog`);
    });
  }

  it("nav links to the catalog in both languages", () => {
    assert.ok(CHROME.includes('"/services#catalog"'), "EN nav catalog link missing");
    assert.ok(CHROME.includes('"/ar/services#catalog"'), "AR nav catalog link missing");
    assert.ok(CHROME.includes("WhatsApp Catalog"), "EN nav catalog label missing");
    assert.ok(CHROME.includes("كتالوج واتساب"), "AR nav catalog label missing");
  });
});
