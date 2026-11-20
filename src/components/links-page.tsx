import Image from "next/image";
import { SITE_LINKS } from "@/lib/links";

/**
 * Links page body (Linktree-style, no nav) — shared by /links, /en/links
 * and /ar/links. The Instagram bio link points at /ar/links.
 */
export default function LinksPage({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  return (
    <main className="shell" dir={isAr ? "rtl" : "ltr"}>
      <section
        style={{
          maxWidth: 520,
          margin: "0 auto",
          padding: "56px 20px 40px",
          textAlign: "center",
        }}
      >
        <Image
          src="/apple-touch-icon.png"
          alt="Supra-Science"
          width={96}
          height={96}
          style={{
            borderRadius: "50%",
            border: "3px solid #06B6D4",
            background: "#0B132B",
          }}
        />
        <h1 style={{ fontSize: 30, margin: "16px 0 4px" }}>
          Supra<span className="gold">-</span>Science
        </h1>
        <p className="lead" style={{ margin: "0 0 4px" }}>
          {isAr
            ? "شريكك الهندسي والتقني الموثوق"
            : "Your trusted engineering & technology partner"}
        </p>
        <p className="muted" style={{ margin: "0 0 28px" }}>
          Learn • Explore • Excel
        </p>
        <div
          style={{ display: "flex", flexDirection: "column", gap: 12 }}
        >
          {SITE_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className={link.primary ? "btn" : "btn secondary"}
              style={{
                width: "100%",
                flexDirection: "column",
                gap: 2,
                padding: "14px 18px",
              }}
            >
              <span>{isAr ? link.labelAr : link.labelEn}</span>
              {link.handle ? (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    opacity: 0.85,
                    direction: "ltr",
                  }}
                >
                  {link.handle}
                </span>
              ) : null}
            </a>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 28 }}>
          © 2026 Supra-Science ·{" "}
          {isAr ? "كل مشروع بعرض سعر مكتوب" : "Every project with a written quotation"}
        </p>
      </section>
    </main>
  );
}
