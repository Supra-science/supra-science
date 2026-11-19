import Link from "next/link";

export type SiteLang = "en" | "ar";

type Offer = { title: string; text: string; href: string; cta: string };

const OFFERS_EN: Offer[] = [
  {
    title: "Free consultation",
    text: "A 30-minute call to understand your project in depth — free, no obligation.",
    href: "/book",
    cta: "Book →",
  },
  {
    title: "Free scope review",
    text: "We read your requirements and return a clear written scope — free.",
    href: "/start",
    cta: "Start free →",
  },
  {
    title: "Free architecture draft",
    text: "A first architecture draft from our intake wizard — free.",
    href: "/start",
    cta: "Start free →",
  },
  {
    title: "Pay upfront after approval",
    text: "No payment before you approve the written scope and quotation. Once approved, an upfront payment is due — then execution starts.",
    href: "/start",
    cta: "Start free →",
  },
  {
    title: "Free written quotation",
    text: "A written quotation with no obligation — free.",
    href: "/start",
    cta: "Start free →",
  },
];

const OFFERS_AR: Offer[] = [
  {
    title: "استشارة مجانية",
    text: "مكالمة 30 دقيقة نفهم فيها مشروعك بعمق — مجاناً وبدون التزام.",
    href: "/ar/book",
    cta: "← احجز موعدك",
  },
  {
    title: "مراجعة نطاق مجانية",
    text: "نقرأ متطلباتك ونعيد لك نطاقاً مكتوباً واضحاً — مجاناً.",
    href: "/ar/start",
    cta: "← ابدأ مجاناً",
  },
  {
    title: "مسودة معمارية مجانية",
    text: "مسودة معمارية أولى من معالج الاستقبال — مجاناً.",
    href: "/ar/start",
    cta: "← ابدأ مجاناً",
  },
  {
    title: "ادفع مقدماً بعد الاعتماد",
    text: "لا دفع قبل اعتمادك النطاق المكتوب وعرض السعر. بعد الاعتماد تُدفع دفعة مقدمة ثم يبدأ التنفيذ.",
    href: "/ar/start",
    cta: "← ابدأ مجاناً",
  },
  {
    title: "عرض سعر مكتوب مجاني",
    text: "عرض سعر مكتوب بدون التزام — مجاناً.",
    href: "/ar/start",
    cta: "← ابدأ مجاناً",
  },
];

/**
 * "Free to start" offers section. Used by the home pages and the
 * /services and /ar/services pages. (Reconstructed from the Nov-8 live
 * bundle, module 21912. The bundle's export is a single-letter name;
 * the original export name is unrecoverable from the minified bundle —
 * see PUBLIC-FINDINGS.md.)
 */
export function FreeOffers({ lang }: { lang: SiteLang }) {
  if (lang === "ar") {
    return (
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="eyebrow">ابدأ مجاناً</div>
        <h2 style={{ fontSize: 28, margin: "12px 0", lineHeight: 1.6 }}>
          ابدأ مجاناً —{" "}
          <span className="gold">
            نثبت قدرتنا قبل أن تدفع فلساً واحداً.
          </span>
        </h2>
        <p className="lead" style={{ fontSize: 15 }}>
          كل ما يلي لا يكلفك شيئاً — لأننا واثقون مما نبنيه. لا بطاقة ولا
          التزام ولا دفع قبل أن تعتمد النطاق المكتوب — وبعد الاعتماد دفعة
          مقدمة، ثم يبدأ التنفيذ.
        </p>
        <div className="offer-grid" style={{ marginTop: 18 }}>
          {OFFERS_AR.map((offer) => (
            <Link
              key={offer.title}
              href={offer.href}
              className="tile"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3>{offer.title}</h3>
              <p className="muted">{offer.text}</p>
              <span className="gold" style={{ fontSize: 13 }}>
                {offer.cta}
              </span>
            </Link>
          ))}
        </div>
        <div
          style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}
        >
          <Link className="btn" href="/ar/book">
            احجز استشارتك المجانية
          </Link>
          <Link className="btn secondary" href="/ar/start">
            ابدأ الاستقبال المجاني
          </Link>
          <a
            className="btn secondary"
            href="https://wa.me/19178183426?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20%D8%B3%D9%88%D8%A8%D8%B1%D8%A7-%D8%B3%D8%A7%D9%8A%D9%86%D8%B3%D8%8C%20%D8%A3%D8%B1%D9%8A%D8%AF%20%D8%A3%D9%86%20%D8%A3%D8%A8%D8%AF%D8%A3%20%D9%85%D8%B4%D8%B1%D9%88%D8%B9%D8%A7%D9%8B."
          >
            تحدث معنا على واتساب
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="panel" style={{ marginBottom: 24 }}>
      <div className="eyebrow">Free to start</div>
      <h2 style={{ fontSize: 28, margin: "12px 0" }}>
        Start free —{" "}
        <span className="gold">
          we prove our capability before you pay a cent.
        </span>
      </h2>
      <p className="lead" style={{ fontSize: 15 }}>
        Everything below costs you nothing — because we are confident in what
        we build. No card, no commitment, no payment until you approve the
        written scope — then an upfront payment, and only then does execution start.
      </p>
      <div className="offer-grid" style={{ marginTop: 18 }}>
        {OFFERS_EN.map((offer) => (
          <Link
            key={offer.title}
            href={offer.href}
            className="tile"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <h3>{offer.title}</h3>
            <p className="muted">{offer.text}</p>
            <span className="gold" style={{ fontSize: 13 }}>
              {offer.cta}
            </span>
          </Link>
        ))}
      </div>
      <div
        style={{ marginTop: 18, display: "flex", gap: 12, flexWrap: "wrap" }}
      >
        <Link className="btn" href="/book">
          Book a free consultation
        </Link>
        <Link className="btn secondary" href="/start">
          Start the free intake
        </Link>
        <a
          className="btn secondary"
          href="https://wa.me/19178183426?text=Hello%20Supra-Science%2C%20I%20want%20to%20start%20a%20project."
        >
          Chat on WhatsApp
        </a>
      </div>
    </section>
  );
}
