import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "الصفحة غير موجودة",
  description: "هذه الصفحة غير موجودة أو تم نقلها.",
  robots: { index: false, follow: true },
};

/**
 * Arabic 404 page. Unlike the root not-found page, this is a static
 * Arabic page that does not use the shared NotFoundContent component.
 * (Reconstructed from the Nov-8 live bundle, module 75789.)
 */
export default function ArNotFound() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />
      <section
        className="dashboard"
        style={{ maxWidth: 860, textAlign: "center" }}
      >
        <div className="eyebrow">404</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          الصفحة <span className="gold">غير موجودة</span>
        </h1>
        <p className="lead">هذه الصفحة غير موجودة أو تم نقلها.</p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <Link className="btn" href="/ar">
            العودة للرئيسية
          </Link>
          <Link className="btn secondary" href="/ar/services">
            استكشف الخدمات
          </Link>
        </div>
      </section>
      <SiteFooter lang="ar" />
    </main>
  );
}
