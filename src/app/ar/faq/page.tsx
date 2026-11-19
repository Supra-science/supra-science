import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import FaqSection, { FaqJsonLd } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "الأسئلة الشائعة",
  description:
    "أسئلة شائعة عن العمل مع سوبرا-ساينس: تحديد النطاق، عروض الأسعار، الجداول الزمنية، مشاريع الذكاء الاصطناعي والعتاد، التواصل، والدعم.",
  alternates: {
    canonical: "/ar/faq",
    languages: { en: "/en/faq", ar: "/ar/faq", "x-default": "/ar/faq" },
  },
};

export default function ArFaqPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">الأسئلة الشائعة</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          أسئلة <span className="gold">وأجوبة.</span>
        </h1>
        <p className="lead">
          الأسئلة التي يطرحها العملاء قبل أن يقرروا. ولأي شيء آخر —{" "}
          <Link className="gold" href="/ar/contact">اسألنا مباشرة</Link> — نجيبك بوضوح.
        </p>
        <FaqSection lang="ar" />
        <FaqJsonLd lang="ar" />
        <div className="panel" style={{ textAlign: "center", padding: "36px 30px", marginTop: 24 }}>
          <h2 style={{ fontSize: 28, margin: "0 0 12px", lineHeight: 1.6 }}>
            ما زال لديك <span className="gold">سؤال؟</span>
          </h2>
          <Link className="btn" href="/ar/contact">
            تواصل معنا
          </Link>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
