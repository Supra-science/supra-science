/**
 * Business-logic tests: intake classifier, WhatsApp link builders,
 * services catalog fallback. The REAL TypeScript sources are compiled
 * with tsc and imported — no inline copies.
 * Run with: npm test
 */

import { describe, it, before } from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = path.join(here, "..");

let intake, links, services;

before(() => {
  execSync(
    "npx tsc src/lib/intake.ts src/lib/whatsapp-links.ts src/lib/services.ts " +
      "--outDir tests/.build --module nodenext --target es2022 " +
      "--moduleResolution nodenext --skipLibCheck",
    { cwd: root, stdio: "pipe" }
  );
});

describe("intake classifier (rule-based, no AI API)", () => {
  it("classifies an AI chatbot request as software-ai", async () => {
    intake = await import("./.build/intake.js");
    const r = intake.classifyProject(
      "I need a chatbot that answers questions from my company documents using AI"
    );
    assert.equal(r.domain, "software-ai");
    assert.ok(["high", "medium"].includes(r.confidence));
  });

  it("classifies Arabic IoT text as embedded-iot", async () => {
    const r = intake.classifyProject("أريد جهاز أردوينو مع حساس حرارة يرسل البيانات");
    assert.equal(r.domain, "embedded-iot");
  });

  it("returns unclear with low confidence for empty text", async () => {
    const r = intake.classifyProject("   ");
    assert.equal(r.domain, "unclear");
    assert.equal(r.confidence, "low");
  });

  it("builds an honest summary mentioning rule-based review", async () => {
    const s = intake.buildProjectSummary(
      {
        description: "WhatsApp booking flow for a clinic",
        budget: "$1,000 – $5,000",
        timeline: "1 – 3 months",
        contact: "WhatsApp",
        name: "Sara",
        email: "sara@example.com",
      },
      "en"
    );
    assert.ok(s.includes("automation") || s.includes("Automation"));
    assert.ok(s.includes("rule-based"));
    assert.ok(s.includes("Sara"));
  });

  it("builds the Arabic summary with Arabic labels", async () => {
    const s = intake.buildProjectSummary(
      { description: "تطبيق", budget: "", timeline: "", contact: "", name: "", email: "" },
      "ar"
    );
    assert.ok(s.includes("سوبرا-ساينس"));
    assert.ok(s.includes("قاعدي"));
  });
});

describe("whatsapp link builders (zero cost)", () => {
  it("builds a wa.me link with the official number", async () => {
    links = await import("./.build/whatsapp-links.js");
    const url = links.serviceRequestLink("hello");
    assert.ok(url.startsWith("https://wa.me/19178183426?text="));
  });

  it("encodes Arabic messages correctly", async () => {
    const msg = links.buildServiceRequestMessage({
      serviceTitle: "البرمجيات والذكاء الاصطناعي",
      lang: "ar",
      name: "فيصل",
    });
    assert.ok(msg.includes("البرمجيات والذكاء الاصطناعي"));
    assert.ok(msg.includes("فيصل"));
    const url = links.serviceRequestLink(msg);
    assert.equal(decodeURIComponent(url.split("text=")[1]), msg);
  });

  it("omits empty optional fields", async () => {
    const msg = links.buildServiceRequestMessage({ serviceTitle: "Software & AI", lang: "en" });
    assert.ok(!msg.includes("Name:"));
    assert.ok(msg.includes("Service: Software & AI"));
  });
});

describe("services catalog fallback", () => {
  it("returns the 5 static services when Supabase is not configured", async () => {
    services = await import("./.build/services.js");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    const list = await services.getServices("en");
    assert.equal(list.length, 5);
    assert.ok(list.every((s) => s.id && s.title && Array.isArray(s.examples)));
  });

  it("returns Arabic titles for ar", async () => {
    const list = await services.getServices("ar");
    assert.ok(list[0].title.length > 0);
    assert.notEqual(list[0].title, (await services.getServices("en"))[0].title);
  });
});
