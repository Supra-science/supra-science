/**
 * AI engine for the Supra-Science assistants.
 *
 * Recovered from the live Nov-8 deployment bundle
 * (embedded `src/lib/ai-engine.ts` module).
 *
 * Providers, in the order the routes try them:
 * 1. Google Gemini (`gemini-3.8-flash`) via GEMINI_API_KEY.
 * 2. Cloudflare Workers AI (`@cf/meta/llama-4-scout-17b-16e-instruct`)
 *    via the `AI` binding from the Cloudflare context.
 * 3. A local rule-based answer built from the service catalog
 *    (no AI call at all) when neither provider is available.
 *
 * Message roles are "system" | "user" | "assistant". Gemini maps
 * "assistant" to "model". System messages become the Gemini
 * system instruction.
 */

import { staticServices, quickLaunch } from "@/lib/services";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GenerateOptions = {
  temperature: number;
  maxOutputTokens: number;
  jsonMode: boolean;
};

const GEMINI_MODEL = "gemini-3.8-flash";
const WORKERS_AI_MODEL = "@cf/meta/llama-4-scout-17b-16e-instruct";
// NOTE (2026-11-19): raised from 20s — Workers AI cold starts (first call
// after idle) regularly exceed 20s, which made the first generation attempt
// fail with 502 while the second (warm) attempt succeeded.
const CALL_TIMEOUT_MS = 45_000;

/** Race a promise against a timeout. */
export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      timer = setTimeout(() => reject(Error(`${label} timed out after ${ms}ms`)), ms);
    }),
  ]).finally(() => {
    if (timer !== undefined) clearTimeout(timer);
  });
}

/** The Cloudflare Workers AI binding, or null when unavailable. */
export function getWorkersAI(): {
  run: (model: string, input: unknown) => Promise<unknown>;
} | null {
  try {
    // Provided by @opennextjs/cloudflare at runtime.
    // (Record<symbol, ...> instead of a computed-property type literal:
    // Symbol.for() returns `symbol`, not a `unique symbol`, so it cannot
    // name a property in a type literal. Behaviour unchanged.)
    const ctx = (
      globalThis as unknown as Record<
        symbol,
        { env?: { AI?: unknown } } | undefined
      >
    )[Symbol.for("__cloudflare-context__")];
    const ai = ctx?.env?.AI as
      | { run?: (model: string, input: unknown) => Promise<unknown> }
      | undefined;
    return ai && typeof ai.run === "function" ? (ai as never) : null;
  } catch {
    return null;
  }
}

async function runWorkersAI(
  messages: ChatMessage[],
  maxTokens: number,
  temperature: number
): Promise<string> {
  const ai = getWorkersAI();
  if (!ai) throw Error("Workers AI binding not available");
  const result = (await withTimeout(
    ai.run(WORKERS_AI_MODEL, { messages, max_tokens: maxTokens, temperature }),
    CALL_TIMEOUT_MS,
    "Workers AI"
  )) as { response?: unknown };
  if (typeof result?.response === "string" && result.response.trim()) {
    return result.response.trim();
  }
  throw Error("Workers AI returned no text");
}

/** Short chat completion via Workers AI (800 tokens, temp 0.6). */
export async function chatWithWorkersAI(messages: ChatMessage[]): Promise<string> {
  return runWorkersAI(messages, 800, 0.6);
}

/** Longer generation via Workers AI (2000 tokens, temp 0.4). */
export async function generateWithWorkersAI(messages: ChatMessage[]): Promise<string> {
  return runWorkersAI(messages, 2000, 0.4);
}

async function callGemini(
  messages: ChatMessage[],
  options: GenerateOptions
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw Error("Gemini API key not configured");
  const systemInstruction = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .join("\n\n");
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
  const res = await withTimeout(fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
    {
      method: "POST",
      headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(systemInstruction
          ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
          : {}),
        contents,
        generationConfig: {
          temperature: options.temperature,
          maxOutputTokens: options.maxOutputTokens,
          ...(options.jsonMode ? { responseMimeType: "application/json" } : {}),
        },
      }),
    }
  ), 30_000, "Gemini"); // NOTE (2026-11-19): raised from 15s — a 2000-token JSON draft can exceed 15s on a slow call, failing the first attempt.
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw Error(`Gemini error ${res.status}: ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw Error("Gemini returned no text");
  return text;
}

/** Short chat completion via Gemini (800 tokens, temp 0.6). */
export async function chatWithGemini(messages: ChatMessage[]): Promise<string> {
  return callGemini(messages, { temperature: 0.6, maxOutputTokens: 800, jsonMode: false });
}

/** JSON-mode generation via Gemini (2000 tokens, temp 0.4). */
export async function generateJsonWithGemini(
  messages: ChatMessage[]
): Promise<string> {
  return callGemini(messages, { temperature: 0.4, maxOutputTokens: 2000, jsonMode: true });
}

/** "Service: starting from $X" lines for one language, plus the
 * Quick-Launch packages (approved indicative ranges, 2026-11-14). */
export function servicePriceLines(lang: "en" | "ar"): string {
  const main = staticServices(lang)
    .map(
      (s) =>
        `- ${s.title}: starting from $${s.startingPriceUsd.toLocaleString("en-US")}`
    )
    .join("\n");
  const quick = quickLaunch(lang)
    .map((p) => `- ${p.title}: ${p.priceRange}`)
    .join("\n");
  return `${main}\n${quick}`;
}

const FREE_OFFERS_EN = [
  "Free 30-minute consultation",
  "Free requirements & scope review",
  "Free architecture draft from the intake wizard",
  "No payment before you approve the written scope",
  "Free written quotation, no obligation",
];

const FREE_OFFERS_AR = [
  "استشارة مجانية لمدة 30 دقيقة",
  "مراجعة مجانية للمتطلبات والنطاق",
  "مسودة معمارية مجانية من معالج الاستقبال",
  "لا دفع قبل اعتمادك النطاق المكتوب",
  "عرض سعر مكتوب مجاني بدون التزام",
];

export function freeOffers(lang: "en" | "ar"): string[] {
  return lang === "ar" ? FREE_OFFERS_AR : FREE_OFFERS_EN;
}

const CONTACT_EN =
  "Contact us: WhatsApp +1 (917) 818-3426 or Supra-science@proton.me — or start at /start.";
const CONTACT_AR =
  "تواصل معنا: واتساب ‎+1 (917) 818-3426 أو البريد Supra-science@proton.me — أو ابدأ من /ar/start.";

/**
 * Local rule-based answer used when no AI provider answers.
 * Detects Arabic, then the visitor's intent (prices/services,
 * WhatsApp, starting a project, free offers) and returns a canned
 * reply built from the real catalog — never invented content.
 */
export function localAnswer(message: string): string {
  const isAr = /[\u0600-\u06FF]/.test(message);
  const lower = message.toLowerCase();
  const lang = isAr ? "ar" : "en";
  const prices = servicePriceLines(lang);
  const offers = freeOffers(lang)
    .map((o) => `- ${o}`)
    .join("\n");
  const contact = isAr ? CONTACT_AR : CONTACT_EN;

  const wantsPrice =
    /price|pricing|cost|quote|quotation|سعر|أسعار|تكلفة|عرض سعر/.test(lower);
  const wantsServices =
    /service|services|what do you|offer|do you do|خدمات|ماذا تقدم|ماذا تفعل/.test(lower);
  const wantsWhatsApp = /whatsapp|واتساب/.test(lower);
  const wantsStart =
    /start|begin|how (do|can) i|ابدأ|كيف أبدأ|أريد مشروع/.test(lower);
  const wantsFree = /free|offer|discount|مجاني|عرض|عروض|خصم/.test(lower);

  if (wantsPrice || wantsServices || wantsFree) {
    return `${
      isAr
        ? "خدمات سوبرا-ساينس وأسعارها الاسترشادية الأولية (بالدولار):"
        : "Supra-Science services and their indicative starting prices (USD):"
    }\n${prices}\n${
      isAr
        ? "السعر النهائي يُحدَّد في عرض السعر المكتوب بعد مراجعة نطاق مشروعك."
        : "The final price is set in your written quotation after we review the scope."
    }\n\n${isAr ? "وكل ما يلي مجاني للبدء:" : "And all of the following is free to start:"}\n${offers}\n\n${contact}`;
  }
  if (wantsWhatsApp) {
    return isAr
      ? "يمكنك مراسلتنا على واتساب للأعمال مباشرة: ‎+1 (917) 818-3426 — أو من صفحة أي خدمة زر «اطلب عبر واتساب». نرد على الاستفسارات ونبدأ من هنا تقييم مشروعك."
      : "You can message us on WhatsApp Business directly: +1 (917) 818-3426 — or use the WhatsApp request button on any service page. We answer inquiries there and start your project evaluation from it.";
  }
  if (wantsStart) {
    return isAr
      ? "لبدء مشروعك: افتح معالج الاستقبال /ar/start وأجب عن الأسئلة (مجاناً)، وسنراجع إجاباتك ونرد عليك انطلاقاً مكتوباً وعرض سعر. أو راسلنا واتساب ‎+1 (917) 818-3426."
      : "To start your project: open the intake wizard at /start and answer the questions (free); we review your answers and reply with a written scope and quotation. Or message us on WhatsApp +1 (917) 818-3426.";
  }
  const serviceList = staticServices(lang)
    .map((s) => `- ${s.title}`)
    .join("\n");
  return `${
    isAr
      ? "أهلاً بك في سوبرا-ساينس. هذه خدماتنا:"
      : "Welcome to Supra-Science. These are our services:"
  }\n${serviceList}\n\n${contact}`;
}

/**
 * Aliases for the public-assistant route. The live bundle minifies export
 * names to single letters; the route was reconstructed with these
 * descriptive names, aliasing the recovered implementations above.
 */
export const ruleBasedReply = localAnswer;
export const formatStartingPrices = servicePriceLines;
/** True when the Cloudflare Workers AI binding is available. */
export function isWorkersAIAvailable(): boolean {
  return getWorkersAI() !== null;
}
