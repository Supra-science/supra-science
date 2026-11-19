import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { BookingForm } from "@/components/booking-form";

export const metadata: Metadata = {
  title: "احجز استشارة مجانية",
  description:
    "احجز استشارة مجانية لمدة 30 دقيقة مع سوبرا-ساينس — الأحد إلى الخميس، 10:00–18:00 بتوقيت عدن (UTC+3)، عبر Google Meet.",
  alternates: {
    canonical: "/ar/book",
    languages: { en: "/en/book", ar: "/ar/book", "x-default": "/ar/book" },
  },
};

export default function ArBookPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section className="hero">
        <div>
          <div className="eyebrow">استشارة مجانية</div>
          <h1>
            احجز <span className="gold">استشارة</span>
          </h1>
          <p className="lead">
            مكالمة فيديو مجانية لمدة 30 دقيقة نفهم فيها مشروعك بعمق — بدون
            التزام. اختر الوقت المناسب لك؛ الاجتماع عبر Google Meet وتصلك
            دعوة تقويم على بريدك.
          </p>
          <p className="muted" style={{ fontSize: 14 }}>
            متاح الأحد–الخميس، 10:00–18:00 بتوقيت عدن (UTC+3). تفضل الكتابة
            أولاً؟{" "}
            <a href="/ar/contact" style={{ color: "#6366F1" }}>
              أرسل لنا رسالة
            </a>{" "}
            أو{" "}
            <a href="https://wa.me/19178183426" style={{ color: "#6366F1" }}>
              تحدث معنا على واتساب
            </a>
            .
          </p>
        </div>
      </section>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "0 24px 80px" }}>
        <BookingForm lang="ar" />
      </div>
      <SiteFooter lang="ar" />
    </main>
  );
}
