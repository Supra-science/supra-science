import { headers } from "next/headers";

export type SiteLang = "en" | "ar";

export type FaqItem = { q: string; a: string };

const FAQ_EN: FaqItem[] = [
  {
    q: "How do we start a project?",
    a: "Send a consultation request through the contact form, email, or WhatsApp. We discuss your problem and constraints in depth, then prepare written requirements, a scope, a timeline, and a quotation for your approval.",
  },
  {
    q: "How much will my project cost?",
    a: "The figures on the service cards are indicative starting prices, not final prices. We quote each project individually after reviewing your requirements carefully — there are no fixed package prices. The quotation states what is included, what is excluded, the timeline, and the payment terms. Request a quote and we will respond with a clear written figure.",
  },
  {
    q: "How long does a typical project take?",
    a: "It depends on scope: a focused integration or prototype can take weeks; a full application or connected system takes longer. You receive a timeline with the quotation, broken into review checkpoints.",
  },
  {
    q: "Do you work in Arabic and English?",
    a: "Yes. The platform, documentation, and communication are available in both languages.",
  },
  {
    q: "Can you build AI features into our product?",
    a: "Yes — where the technology genuinely fits. We integrate language models, build assistants and document pipelines, and evaluate AI behavior on your data. We will tell you plainly when a requested AI capability is not reliable enough for production — and we will not build what does not work.",
  },
  {
    q: "Do you build hardware and IoT devices?",
    a: "We develop embedded firmware and connected-device prototypes (Arduino/ESP32, sensors, device-to-cloud). Deliverables are working prototypes with documentation and test reports — not mass production.",
  },
  {
    q: "Are your medical prototypes certified medical devices?",
    a: "No. Our scientific and medical-technology work produces research and teaching prototypes with documented capabilities and limits. We do not claim medical certification, clinical-diagnostic suitability, or regulatory approval.",
  },
  {
    q: "How do we communicate during the project?",
    a: "Through the client portal, email, or WhatsApp — in English or Arabic. You also get review checkpoints at defined milestones.",
  },
  {
    q: "Who owns the work when the project ends?",
    a: "You receive the working system, the source code, and the complete documentation at handover, as stated in your scope — the work is entirely yours.",
  },
  {
    q: "What happens after delivery?",
    a: "An agreed support window covers fixes and questions. Longer maintenance or new phases are quoted separately.",
  },
  {
    q: "How do payments work?",
    a: "Payment terms are defined in your quotation. Payments are made by the methods agreed in your quotation — bank transfer or cash pickup. We never ask for or store card numbers.",
  },
];

const FAQ_AR: FaqItem[] = [
  {
    q: "كيف نبدأ مشروعاً؟",
    a: "أرسل طلب استشارة عبر نموذج التواصل أو البريد أو واتساب. نناقش مشكلتك وقيودك بعمق، ثم نُعد المتطلبات المكتوبة والنطاق والجدول الزمني وعرض السعر لاعتمادك.",
  },
  {
    q: "كم سيكلف مشروعي؟",
    a: "الأرقام الظاهرة على بطاقات الخدمات أسعار استرشادية أولية وليست أسعاراً نهائية. نُسعّر كل مشروع على حدة بعد مراجعة متطلباتك بدقة — لا توجد أسعار باقات ثابتة. يحدد عرض السعر ما يشمله وما يستثنيه والجدول الزمني وشروط الدفع. اطلب عرض سعر وسنرد برقم مكتوب واضح.",
  },
  {
    q: "كم تستغرق المشاريع عادة؟",
    a: "يعتمد على النطاق: التكامل المركّز أو النموذج الأولي قد يستغرق أسابيع؛ والتطبيق الكامل أو النظام المتصل يستغرق أطول. تستلم جدولاً زمنياً مع عرض السعر، مقسّماً إلى نقاط مراجعة.",
  },
  {
    q: "هل تعملون بالعربية والإنجليزية؟",
    a: "نعم. المنصة والتوثيق والتواصل متاحة باللغتين.",
  },
  {
    q: "هل يمكنكم بناء مزايا ذكاء اصطناعي في منتجنا؟",
    a: "نعم — حيث تناسب التقنية فعلاً. ندمج نماذج اللغة ونبني المساعدات وخطوط المستندات ونقيّم سلوك الذكاء الاصطناعي على بياناتك. وسنقول لك بصراحة عندما لا تكون قدرة ذكاء اصطناعي مطلوبة موثوقة بما يكفي للإنتاج — ولن نبني ما لا يعمل.",
  },
  {
    q: "هل تبنون العتاد وأجهزة إنترنت الأشياء؟",
    a: "نطوّر البرمجيات الثابتة المدمجة والنماذج الأولية للأجهزة المتصلة (أردوينو/ESP32، الحساسات، الربط السحابي). المخرجات نماذج أولية عاملة مع توثيق وتقارير اختبار — وليست إنتاجاً ضخماً.",
  },
  {
    q: "هل نماذجكم الطبية أجهزة طبية معتمدة؟",
    a: "لا. أعمالنا العلمية والطبية تُنتج نماذج أولية للبحث والتدريس بقدرات وقيود موثقة. لا ندّعي شهادة طبية أو صلاحية تشخيص سريري أو اعتماداً تنظيمياً.",
  },
  {
    q: "كيف نتواصل أثناء المشروع؟",
    a: "عبر بوابة العميل أو البريد أو واتساب — بالعربية أو الإنجليزية. وتحصل أيضاً على نقاط مراجعة عند مراحل محددة.",
  },
  {
    q: "من يملك العمل عند انتهاء المشروع؟",
    a: "تستلم النظام العامل والكود المصدري والتوثيق الكامل عند التسليم، كما ينص النطاق المعتمد — العمل كله لك.",
  },
  {
    q: "ماذا بعد التسليم؟",
    a: "نافذة دعم متفق عليها تغطي الإصلاحات والأسئلة. الصيانة الأطول أو المراحل الجديدة تُسعَّر على حدة.",
  },
  {
    q: "كيف تتم المدفوعات؟",
    a: "تُحدَّد شروط الدفع في عرض السعر. تتم المدفوعات بالطرق المتفق عليها في عرض السعر — تحويل بنكي أو استلام نقدي. ولا نطلب أرقام البطاقات ولا نخزنها أبداً.",
  },
];

const FAQ: Record<SiteLang, FaqItem[]> = { en: FAQ_EN, ar: FAQ_AR };

/**
 * FAQ list (details/summary tiles). Used by the home pages and the
 * /faq and /ar/faq pages. (Reconstructed from the Nov-8 live bundle,
 * module 62531. The bundle's default export is this list and its named
 * export is the JSON-LD script below; the original export names are
 * unrecoverable from the minified bundle — see PUBLIC-FINDINGS.md.)
 */
export default function FaqSection({ lang }: { lang: SiteLang }) {
  const items = lang === "ar" ? FAQ_AR : FAQ_EN;
  return (
    <div style={{ marginTop: 28 }}>
      {items.map((item) => (
        <details key={item.q} className="tile" style={{ marginBottom: 12 }}>
          <summary
            style={{
              cursor: "pointer",
              fontWeight: 700,
              color: "#0B132B",
              fontSize: 16,
            }}
          >
            {item.q}
          </summary>
          <p
            className="muted"
            style={{ margin: "12px 0 0", lineHeight: lang === "ar" ? 2 : 1.9 }}
          >
            {item.a}
          </p>
        </details>
      ))}
    </div>
  );
}

/** FAQPage JSON-LD (schema.org) for the current language. */
export async function FaqJsonLd({ lang }: { lang: SiteLang }) {
  // CSP nonce (added 2026-11-13, audit finding #9): see layout.tsx.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ[lang].map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: { "@type": "Answer", text: item.a },
          })),
        }),
      }}
    />
  );
}
