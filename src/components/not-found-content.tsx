"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { usePageTitle } from "@/lib/use-page-title";

/**
 * Shared 404 content (client component). Detects Arabic from the current
 * pathname (/ar…) and falls back to the `initialIsAr` prop supplied by
 * the server not-found page (which reads the `x-pathname` header), so the
 * correct language renders even before hydration. Sets the document
 * title via usePageTitle.
 * (Reconstructed from the Nov-8 live bundle, module 1073.)
 */
export default function NotFoundContent({
  initialIsAr = false,
}: {
  initialIsAr?: boolean;
}) {
  const pathname = usePathname();
  const isAr = pathname ? pathname.startsWith("/ar") : initialIsAr;
  usePageTitle(
    isAr ? "الصفحة غير موجودة | سوبرا-ساينس" : "Page not found | Supra-Science",
  );
  const lang = isAr ? "ar" : "en";

  return (
    <main className="shell" dir={isAr ? "rtl" : "ltr"} lang={lang}>
      <SiteNav lang={lang} />
      <section
        className="dashboard"
        style={{ maxWidth: 860, textAlign: "center" }}
      >
        <div className="eyebrow">404</div>
        <h1 style={{ fontSize: 44, lineHeight: 1.5 }}>
          {isAr ? (
            <>
              الصفحة <span className="gold">غير موجودة</span>
            </>
          ) : (
            <>
              Page <span className="gold">not found</span>
            </>
          )}
        </h1>
        <p className="lead">
          {isAr
            ? "هذه الصفحة غير موجودة أو تم نقلها."
            : "This page does not exist or was moved."}
        </p>
        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: 20,
          }}
        >
          <Link className="btn" href={isAr ? "/ar" : "/"}>
            {isAr ? "العودة للرئيسية" : "Return Home"}
          </Link>
          <Link
            className="btn secondary"
            href={isAr ? "/ar/services" : "/services"}
          >
            {isAr ? "استكشف الخدمات" : "Explore Services"}
          </Link>
        </div>
      </section>
      <SiteFooter lang={lang} />
    </main>
  );
}
