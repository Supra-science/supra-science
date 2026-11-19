/**
 * Tests for the Brand Identity Guide (2026-11-13), adopted 2026-11-13
 * to replace Connected Titanium. Static source assertions.
 * Run with: node --test tests/
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
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

const OLD_HEXES = ["#0B2447", "#19A7CE", "#576CBC", "#F6F6F6", "#1E2022"];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx|css)$/.test(name)) out.push(p);
  }
  return out;
}

describe("brand identity guide — new palette", () => {
  it("globals.css defines the guide palette (60/30/10)", () => {
    const css = src("app/globals.css");
    assert.match(css, /--navy:#0B132B/, "navy must be Cosmic Navy #0B132B");
    assert.match(css, /--blue:#06B6D4/, "secondary must be Supra Cyan #06B6D4");
    assert.match(css, /--cyan:#06B6D4/, "cyan must be #06B6D4");
    assert.match(css, /--gold2:#6366F1/, "accent must be Ultraviolet Indigo #6366F1");
    assert.match(css, /--ink:#F8FAFC/, "page background must be Slate Alabaster #F8FAFC");
    assert.match(css, /color:#1E293B/, "body text must be Deep Slate #1E293B");
    assert.match(css, /linear-gradient\(135deg,#818cf8,#6366F1\)/, "primary CTA must be an indigo gradient");
    for (const h of OLD_HEXES) {
      assert.doesNotMatch(css, new RegExp(h, "i"), `globals.css must not contain old ${h}`);
    }
  });

  it("no Connected Titanium hex remains in src, favicon or manifest", () => {
    const files = [...walk(SRC), join(ROOT, "public/favicon.svg"), join(ROOT, "public/site.webmanifest")];
    const bad = [];
    for (const f of files) {
      const code = readFileSync(f, "utf8");
      for (const h of OLD_HEXES) {
        if (code.toUpperCase().includes(h)) bad.push(`${f}: ${h}`);
      }
    }
    assert.deepEqual(bad, [], `old palette found in: ${bad.join("; ")}`);
  });

  it("guide fonts are loaded and mono is IBM Plex Mono", () => {
    const css = src("app/globals.css");
    const layout = src("app/layout.tsx");
    for (const fam of ["Cairo", "Noto+Sans+Arabic", "Space+Grotesk", "IBM+Plex+Mono"]) {
      assert.ok(css.includes(fam), `globals.css @import must load ${fam}`);
      assert.ok(layout.includes(fam), `layout font link must load ${fam}`);
    }
    assert.doesNotMatch(css, /Roboto Mono/, "globals.css must not load Roboto Mono anymore");
    assert.doesNotMatch(layout, /Roboto Mono/, "layout must not load Roboto Mono anymore");
    assert.match(css, /font-family:'IBM Plex Mono','IBM Plex Sans Arabic',ui-monospace,monospace/, "mono stack must be IBM Plex Mono with IBM Plex Sans Arabic fallback (P0-01: Arabic text in mono elements must not render as tofu boxes)");
    assert.match(css, /font-family:'Space Grotesk',Inter,'IBM Plex Sans Arabic'/, "headings must lead with Space Grotesk");
  });

  it("admin header brandmark matches the logo lockup on a light background", () => {
    const layout = src("app/admin/layout.tsx");
    // Badge: same as the public .brandmark — white, cyan border, indigo S
    // (a solid cyan badge with a navy S was unreadable and inconsistent).
    assert.match(layout, /background: "#ffffff", color: "#6366F1", border: "1px solid #06B6D4"/);
    // Wordmark: one navy color (SUPRA + SCIENCE), indigo slash —
    // cyan text on a light background was washed out.
    assert.doesNotMatch(layout, /color: "#06B6D4"\s*\}\s*>\s*\/</, "slash must not be cyan on light");
    assert.doesNotMatch(layout, /<span style=\{\{ color: "#6366F1" \}\}>SCIENCE<\/span>/, "SCIENCE must be navy, not indigo");
    // ADMIN must be a separated pill, not bare text running into SCIENCE.
    assert.match(layout, /background: "#EEF2FF", borderRadius: 999/);
  });

  it("emerald is used for the verified/connected status", () => {
    const code = src("app/admin/integrations/page.tsx");
    assert.match(code, /Connected: "#10B981"/, "Connected status must be Bio-Emerald #10B981");
  });
});

describe("brand identity guide — logo files", () => {
  const LOGO_DIR = join(ROOT, "..", "supra-science-logo");

  it("logo generator uses the guide palette and Space Grotesk", () => {
    const gen = readFileSync(join(LOGO_DIR, "make_logo.py"), "utf8");
    assert.match(gen, /NAVY\s+= \(11, 19, 43\)/, "generator navy must be #0B132B");
    assert.match(gen, /INDIGO = \(99, 102, 241\)/, "generator indigo must be #6366F1");
    assert.match(gen, /CYAN\s+= \(6, 182, 212\)/, "generator cyan must be #06B6D4");
    assert.match(gen, /FONT = "SpaceGrotesk\.ttf"/, "generator must render the wordmark in Space Grotesk");
    assert.doesNotMatch(gen, /INDIGONOLOGY/, "tagline must read TECHNOLOGY, not a mangled word");
  });

  it("regenerated logo files exist", () => {
    for (const f of ["logo-navy.png", "logo-light.png", "icon-navy.png", "cover-navy.png", "whatsapp-profile.png"]) {
      assert.ok(existsSync(join(LOGO_DIR, f)), `${f} must exist`);
    }
    for (const f of ["og-image.png", "apple-touch-icon.png", "favicon.ico", "favicon.svg"]) {
      assert.ok(existsSync(join(ROOT, "public", f)), `public/${f} must exist`);
    }
  });
});
