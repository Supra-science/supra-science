/**
 * Guards for the public marketing site (brand transformation).
 * Run with: node --test tests/
 *
 * Ensures no placeholder/demo/B12 content ships in visitor-facing pages,
 * and that the sitemap covers every public route.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const APP = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "app");

const PUBLIC_PAGES = [
  "page.tsx",
  "services/page.tsx",
  "about/page.tsx",
  "process/page.tsx",
  "faq/page.tsx",
  "privacy/page.tsx",
  "terms/page.tsx",
  "ar/page.tsx",
  "ar/services/page.tsx",
  "ar/about/page.tsx",
  "ar/process/page.tsx",
  "ar/faq/page.tsx",
  "ar/privacy/page.tsx",
  "ar/terms/page.tsx",
  // English URL twins (added 2026-11-13, audit finding #2).
  "en/page.tsx",
  "en/services/page.tsx",
  "en/about/page.tsx",
  "en/process/page.tsx",
  "en/faq/page.tsx",
  "en/privacy/page.tsx",
  "en/terms/page.tsx",
];

const FORBIDDEN = [
  /b12sites\.com/i,
  /\bAlex\b/,
  /lorem ipsum/i,
  /\bDemo\b/,
  /\bSample\b(?! data)/, // "sample data" in requirements copy is legitimate
  /24\/7/,
  /\$[0-9]/, // no advertised prices on public pages
  /suprascience\.eng@gmail\.com/i,
  /goodyour583\+suprascience@gmail\.com/i,
];

describe("public site brand guards", () => {
  for (const p of PUBLIC_PAGES) {
    it(`${p} exists`, () => {
      assert.ok(existsSync(join(APP, p)), `missing ${p}`);
    });
  }

  for (const p of PUBLIC_PAGES) {
    it(`${p} has no placeholder/demo/B12/pricing content`, () => {
      const src = readFileSync(join(APP, p), "utf8");
      for (const re of FORBIDDEN) {
        assert.doesNotMatch(src, re, `${p} matches forbidden pattern ${re}`);
      }
    });
  }

  for (const p of PUBLIC_PAGES) {
    it(`${p} exports page metadata`, () => {
      const src = readFileSync(join(APP, p), "utf8");
      assert.match(src, /export const metadata/, `${p} missing metadata export`);
    });
  }

  for (const p of PUBLIC_PAGES) {
    it(`${p} declares canonical + hreflang alternates`, () => {
      const src = readFileSync(join(APP, p), "utf8");
      assert.match(src, /alternates:\s*\{/, `${p} missing alternates`);
      assert.match(src, /canonical:\s*"\//, `${p} missing canonical`);
      assert.match(src, /languages:\s*\{\s*en:.*ar:/s, `${p} missing en/ar hreflang`);
      assert.doesNotMatch(src, /b12sites\.com/i, `${p} canonical points at B12`);
    });
  }

  it("sitemap covers all new public routes", () => {
    const src = readFileSync(join(APP, "sitemap.xml", "route.ts"), "utf8");
    // Final URLs only: non-/ar, non-/en paths 301-redirect to their /ar twin for
    // cookie-less visitors (including crawlers), and /ar/ 308-redirects
    // to /ar, so they must not be listed.
    for (const r of [
      "/ar", "/ar/services", "/ar/about",
      "/ar/process", "/ar/faq",
      "/ar/privacy", "/ar/terms", "/ar/refund", "/ar/contact", "/ar/start", "/ar/book",
    ]) {
      assert.ok(src.includes(`"${r}"`), `sitemap missing ${r}`);
    }
    // English twins (added 2026-11-13, audit finding #2).
    for (const r of [
      "/en", "/en/services", "/en/about",
      "/en/process", "/en/faq",
      "/en/privacy", "/en/terms", "/en/refund", "/en/contact", "/en/start", "/en/book",
    ]) {
      assert.ok(src.includes(`"${r}"`), `sitemap missing ${r}`);
    }
    assert.ok(src.includes("hreflang"), "sitemap must declare hreflang alternates");
    for (const r of ['"/"', '"/ar/"', '"/services"', '"/about"', '"/login"', '"/signup"']) {
      assert.ok(!src.includes(r), `sitemap must not list ${r}`);
    }
  });

  it("contact layouts declare canonical + hreflang alternates", () => {
    for (const l of ["contact/layout.tsx", "ar/contact/layout.tsx"]) {
      const src = readFileSync(join(APP, l), "utf8");
      assert.match(src, /alternates:\s*\{/, `${l} missing alternates`);
      assert.match(src, /canonical:\s*"\//, `${l} missing canonical`);
      assert.match(src, /languages:\s*\{\s*en:.*ar:/s, `${l} missing en/ar hreflang`);
    }
  });

  it("dashboard and admin layouts are noindex", () => {
    for (const l of ["dashboard/layout.tsx", "admin/layout.tsx"]) {
      const src = readFileSync(join(APP, l), "utf8");
      assert.match(src, /index:\s*false/, `${l} must be noindex`);
    }
  });

  it("shared chrome has no B12 links and lists legal pages", () => {
    const src = readFileSync(join(APP, "..", "components", "site-chrome.tsx"), "utf8");
    assert.doesNotMatch(src, /b12sites\.com/i);
    assert.ok(src.includes("/privacy"));
    assert.ok(src.includes("/terms"));
  });
});
