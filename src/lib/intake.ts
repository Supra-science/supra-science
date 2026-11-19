/**
 * Rule-based project intake — zero cost, no AI API.
 *
 * classifyProject() scores the visitor's free-text description against
 * keyword sets (EN + AR) for the five approved service domains and returns
 * the best match with an honest confidence level. buildProjectSummary()
 * turns the wizard answers into a structured summary the visitor can send
 * via WhatsApp or the contact form.
 */

export type DomainId =
  | "digital-products"
  | "software-ai"
  | "embedded-iot"
  | "scientific"
  | "automation"
  | "unclear";

export const DOMAIN_LABELS: Record<DomainId, { en: string; ar: string }> = {
  "digital-products": { en: "Digital products & applications", ar: "المنتجات والتطبيقات الرقمية" },
  "software-ai": { en: "Software & AI", ar: "البرمجيات والذكاء الاصطناعي" },
  "embedded-iot": { en: "Embedded systems & IoT", ar: "الأنظمة المدمجة وإنترنت الأشياء" },
  "scientific": { en: "Scientific & medical prototypes", ar: "النماذج العلمية والطبية الأولية" },
  "automation": { en: "Business automation & WhatsApp", ar: "أتمتة الأعمال وواتساب" },
  "unclear": { en: "Needs human review", ar: "يحتاج مراجعة بشرية" },
};

const KEYWORDS: Record<Exclude<DomainId, "unclear">, string[]> = {
  "digital-products": [
    "app", "website", "web", "portal", "dashboard", "mobile", "android", "ios",
    "تطبيق", "موقع", "بوابة", "لوحة", "جوال", "أندرويد",
  ],
  "software-ai": [
    "ai", "artificial intelligence", "chatbot", "llm", "model", "data analysis",
    "python", "automation", "machine learning",
    "ذكاء اصطناعي", "نموذج", "تحليل بيانات", "بايثون", "تعلم آلة", "روبوت محادثة",
  ],
  "embedded-iot": [
    "arduino", "esp32", "sensor", "iot", "embedded", "microcontroller", "pcb",
    "firmware", "device",
    "أردوينو", "حساس", "إنترنت الأشياء", "متحكم", "جهاز", "دائرة",
  ],
  "scientific": [
    "medical", "signal", "measurement", "laboratory", "lab", "prototype",
    "monitoring", "calibration",
    "طبي", "إشارة", "قياس", "مختبر", "نموذج أولي", "مراقبة", "معايرة",
  ],
  "automation": [
    "whatsapp", "crm", "notification", "booking", "workflow", "support",
    "واتساب", "حجز", "إشعار", "سير عمل", "دعم",
  ],
};

export function classifyProject(text: string): {
  domain: DomainId;
  confidence: "high" | "medium" | "low";
  matched: string[];
} {
  const t = text.toLowerCase();
  const scores = new Map<DomainId, { n: number; words: string[] }>();
  for (const [domain, words] of Object.entries(KEYWORDS) as Array<[Exclude<DomainId, "unclear">, string[]]>) {
    const hits = words.filter((w) => t.includes(w.toLowerCase()));
    scores.set(domain, { n: hits.length, words: hits });
  }
  const ranked = [...scores.entries()].sort((a, b) => b[1].n - a[1].n);
  const [best, bestScore] = ranked[0];
  if (bestScore.n === 0) return { domain: "unclear", confidence: "low", matched: [] };
  const second = ranked[1][1].n;
  const confidence = bestScore.n >= 3 && bestScore.n > second + 1 ? "high" : bestScore.n >= 2 ? "medium" : "low";
  return { domain: best, confidence, matched: bestScore.words.slice(0, 6) };
}

export type IntakeAnswers = {
  description: string;
  budget: string;
  timeline: string;
  contact: string;
  name: string;
  email: string;
};

export function buildProjectSummary(a: IntakeAnswers, lang: "en" | "ar"): string {
  const c = classifyProject(a.description);
  const label = DOMAIN_LABELS[c.domain][lang];
  if (lang === "ar") {
    return [
      "ملخص طلب مشروع — سوبرا-ساينس",
      `المجال المقترح (قاعدي): ${label} — ثقة ${c.confidence === "high" ? "عالية" : c.confidence === "medium" ? "متوسطة" : "منخفضة"}`,
      `وصف المشروع: ${a.description.trim() || "—"}`,
      `الميزانية: ${a.budget || "—"}`,
      `الجدول الزمني: ${a.timeline || "—"}`,
      `التواصل المفضل: ${a.contact || "—"}`,
      `الاسم: ${a.name.trim() || "—"}`,
      `البريد: ${a.email.trim() || "—"}`,
      "ملاحظة: هذا التصنيف آلي قاعدي ويُراجع بشرياً قبل أي عرض سعر.",
    ].join("\n");
  }
  return [
    "Project intake summary — Supra-Science",
    `Suggested domain (rule-based): ${label} — ${c.confidence} confidence`,
    `Project description: ${a.description.trim() || "—"}`,
    `Budget: ${a.budget || "—"}`,
    `Timeline: ${a.timeline || "—"}`,
    `Preferred contact: ${a.contact || "—"}`,
    `Name: ${a.name.trim() || "—"}`,
    `Email: ${a.email.trim() || "—"}`,
    "Note: this classification is rule-based and reviewed by a human before any quotation.",
  ].join("\n");
}
