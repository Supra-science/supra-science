import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { IntakeWizard } from "@/components/intake-wizard";

export const metadata: Metadata = {
  title: "ابدأ مشروعك",
  description:
    "استشارة موجّهة لطلبات المشاريع: صف فكرتك واحصل على ملخص منظم وأرسله عبر واتساب أو نموذج التواصل.",
  alternates: {
    canonical: "/ar/start",
    languages: { en: "/en/start", ar: "/ar/start", "x-default": "/ar/start" },
  },
};

export default function StartPageAr() {
  return (
    <main className="shell" dir="rtl">
      <SiteNav lang="ar" />
      <section className="dashboard" style={{ paddingTop: 40 }}>
        <h1 style={{ fontSize: 40, textAlign: "center", margin: "0 0 8px" }}>
          ابدأ <span className="gold">مشروعك</span>
        </h1>
        <p className="lead" style={{ textAlign: "center", margin: "0 auto 24px" }}>
          صف فكرتك في أربع خطوات واحصل على ملخص منظم — ثم أرسله عبر واتساب أو نموذج التواصل.
        </p>
        <IntakeWizard lang="ar" />
        <p className="muted" style={{ textAlign: "center", marginTop: 18, fontSize: 13 }}>
          تفضل الحديث مع إنسان أولاً؟ <Link className="gold" href="/ar/contact">تواصل معنا مباشرة ←</Link>
        </p>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
