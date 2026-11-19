import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { getServices, quickLaunch, type Service, type QuickLaunchPackage } from "@/lib/services";
import { WhatsAppRequest } from "@/components/whatsapp-request";
import { WhatsAppCatalog } from "@/components/whatsapp-catalog";
import { FreeOffers } from "@/components/free-offers";

export const metadata: Metadata = {
  title: "الخدمات",
  description:
    "خدمات سوبرا-ساينس: المنتجات والتطبيقات الرقمية، البرمجيات والذكاء الاصطناعي، الأنظمة المدمجة وإنترنت الأشياء، النماذج العلمية والطبية الأولية، أتمتة الأعمال وتكامل واتساب. اطلب عرض سعر.",
  alternates: {
    canonical: "/ar/services",
    languages: { en: "/en/services", ar: "/ar/services", "x-default": "/ar/services" },
  },
};


function ServiceBlock({ s }: { s: Service }) {
  return (
    <section id={s.id} className="panel" style={{ marginBottom: 24, scrollMarginTop: 90 }}>
      <div className="eyebrow">خدمة</div>
      <h2 style={{ fontSize: 30, margin: "12px 0", lineHeight: 1.6 }}>{s.title}</h2>
      {s.image && (
        <div className="service-img-wrap" style={{ marginBottom: 16 }}>
          <img
            src={s.image}
            alt={s.title}
            loading="lazy"
            width={s.imageWidth}
            height={s.imageHeight}
          />
        </div>
      )}
      {s.startingPriceUsd !== undefined && (
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "baseline",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <span className="price-tag">
            يبدأ من ${s.startingPriceUsd.toLocaleString("en-US")}
          </span>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {s.priceNote}
          </span>
        </div>
      )}
      <p style={{ fontSize: 15, lineHeight: 2 }}>
        <strong className="gold">المشكلة: </strong>
        {s.problem}
      </p>
      <p className="lead" style={{ fontSize: 15 }}>{s.description}</p>
      <div className="tiles-2" style={{ marginTop: 18 }}>
        <div className="tile">
          <h3>نطاق العمل</h3>
          <ul className="muted" style={{ paddingInlineStart: 18, margin: 0, lineHeight: 2 }}>
            {s.scope.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="tile">
          <h3>التقنيات</h3>
          <p className="muted">{s.technologies}</p>
          <h3 style={{ marginTop: 16 }}>المخرجات</h3>
          <p className="muted">{s.deliverables}</p>
        </div>
      </div>
      <div className="tile" style={{ marginTop: 16, borderStyle: "dashed" }}>
        <h3>أمثلة تطبيقية معتادة</h3>
        <ul className="muted" style={{ paddingInlineStart: 18, margin: "0 0 8px", lineHeight: 1.9 }}>
          {s.examples.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 11.5, marginBottom: 0 }}>
          أمثلة توضيحية لأنواع التطبيقات — ليست أعمال عملاء ولا مشاريع منجزة.
        </p>
      </div>
      <div className="tile" style={{ marginTop: 16 }}>
        <h3>ما نحتاجه منك</h3>
        <p className="muted" style={{ marginBottom: 14 }}>{s.needFromYou}</p>
        <Link className="btn" href="/ar/contact">
          اطلب عرض سعر
        </Link>
        <WhatsAppRequest serviceTitle={s.title} lang="ar" />
      </div>
    </section>
  );
}

/**
 * باقات التنفيذ السريع العلمية والذكاء الاصطناعي (أضيفت 2026-11-14،
 * قرار المؤسس 1): باقات سريعة القرار للطلاب والأطباء والباحثين —
 * إضافة أسفل الخدمات الهندسية الخمس، وليست بديلاً عنها أبداً. الأسعار
 * نطاقات استرشادية معتمدة.
 */
function QuickLaunchSection({ packages }: { packages: QuickLaunchPackage[] }) {
  return (
    <section id="quick-launch" className="panel" style={{ marginBottom: 24, scrollMarginTop: 90 }}>
      <div className="eyebrow">باقات التنفيذ السريع · جديد</div>
      <h2 style={{ fontSize: 30, margin: "12px 0", lineHeight: 1.6 }}>
        باقات التنفيذ <span className="gold">السريع العلمية والذكاء الاصطناعي</span>
      </h2>
      <p className="lead">
        باقات سريعة القرار للباحثين والأطباء والعيادات — نطاقات سعرية
        استرشادية ثابتة، وبنفس انضباط النطاق المكتوب في كل أعمال
        سوبرا-ساينس. السعر النهائي يُحدَّد في عرض السعر المكتوب بعد مراجعة
        النطاق.
      </p>
      {packages.map((p) => (
        <div key={p.id} className="tile" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 21, lineHeight: 1.6 }}>{p.title}</h3>
          <p className="muted" style={{ margin: "4px 0 12px" }}>{p.tagline}</p>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "baseline",
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <span className="price-tag">{p.priceRange}</span>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {p.priceNote}
            </span>
          </div>
          {p.tiers && (
            <ul className="muted" style={{ paddingInlineStart: 18, margin: "0 0 12px", lineHeight: 2 }}>
              {p.tiers.map((t) => (
                <li key={t.name}>
                  <strong>{t.name} — {t.price}: </strong>
                  {t.includes} · {t.revisions}
                </li>
              ))}
            </ul>
          )}
          <p style={{ fontSize: 15, lineHeight: 2 }}>
            <strong className="gold">لمن هذه الباقة: </strong>
            {p.audience}
          </p>
          <ul className="muted" style={{ paddingInlineStart: 18, margin: "0 0 8px", lineHeight: 2 }}>
            {p.scope.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="muted" style={{ marginBottom: 14 }}>
            <strong>المخرجات: </strong>
            {p.deliverables}
          </p>
          {p.sampleUrl && (
            <p style={{ marginBottom: 14 }}>
              <a
                className="gold"
                href={p.sampleUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.sampleLabel ?? "عرض العينة (PDF)"} ←
              </a>
            </p>
          )}
          <Link className="btn" href="/ar/contact">
            اطلب عرض سعر
          </Link>
          <WhatsAppRequest serviceTitle={p.title} lang="ar" />
        </div>
      ))}
    </section>
  );
}

export default async function ArServicesPage() {
  const SERVICES = await getServices("ar");
  const PACKAGES = quickLaunch("ar");
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="dashboard">
        <div className="eyebrow">الخدمات</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          خدمات هندسية، <span className="gold">محددة بدقة وصدق.</span>
        </h1>
        <p className="lead">
          كل خدمة أدناه مشروع محدد بذاته: نطاق مكتوب وجدول زمني وعرض سعر. وتظهر في كل بطاقة
          أسعار استرشادية أولية — ويُحدَّد السعر النهائي في عرض السعر المكتوب بعد مراجعة نطاق
          مشروعك بدقة.{" "}
          <Link className="gold" href="/ar/contact">
            ← اطلب عرض سعر
          </Link>
        </p>
        <p className="muted" style={{ maxWidth: 720 }}>
          ملاحظة: النماذج الأولية وأنظمة الذكاء الاصطناعي تُسلَّم كأعمال هندسية
          بقدرات وقيود موثقة. لا ندّعي شهادة طبية أو صلاحية تشخيص سريري أو
          اعتماداً تنظيمياً ما لم يُثبت ويُوثَّق.
        </p>
        <div style={{ marginTop: 32 }}>
          {SERVICES.map((s) => (
            <ServiceBlock key={s.id} s={s} />
          ))}
        </div>
        <QuickLaunchSection packages={PACKAGES} />
        <WhatsAppCatalog lang="ar" services={SERVICES} />
        <FreeOffers lang="ar" />
        <div className="panel" style={{ textAlign: "center", padding: "40px 30px" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 12px", lineHeight: 1.6 }}>
            مشروعك، <span className="gold">مُسعَّر كما يستحق.</span>
          </h2>
          <p className="lead" style={{ margin: "0 auto 22px", maxWidth: 560 }}>
            أخبرنا ما تحتاج إلى بنائه أو قياسه أو أتمتته — وسنرد بنطاق مكتوب وعرض سعر واضح.
          </p>
          <Link className="btn" href="/ar/contact">
            ابدأ مشروعك
          </Link>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
