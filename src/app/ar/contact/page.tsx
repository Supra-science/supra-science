import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description:
    "تحدث إلى سوبرا-ساينس عن مشروعك — بالبريد أو واتساب أو Google Meet. نرد بالعربية والإنجليزية.",
  alternates: {
    canonical: "/ar/contact",
    languages: { en: "/en/contact", ar: "/ar/contact", "x-default": "/ar/contact" },
  },
};

const BUSINESS_EMAIL = "Supra-science@proton.me";

export default function ArContactPage() {
  return (
    <main className="shell" dir="rtl" lang="ar">
      <SiteNav lang="ar" />

      <section className="hero" style={{ alignItems: "start" }}>
        <div>
          <div className="eyebrow">تواصل معنا</div>
          <h1>تحدث إلى <span className="gold">سوبرا-ساينس</span></h1>
          <p className="lead">
            أخبرنا عن مشروعك — وسيرد عليك من يبنيه، بالعربية أو الإنجليزية.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
            <a className="btn secondary" href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
            <a className="btn secondary" href="https://wa.me/19178183426">واتساب: ‎+1 (917) 818-3426‎</a>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            داخل اليمن:{" "}
            <a className="gold" href="https://wa.me/967770601092">واتساب ‎+967 770 601 092‎</a>
          </p>
        </div>

        <div className="panel">
          <ContactForm lang="ar" />
        </div>
      </section>

      <SiteFooter lang="ar" />
    </main>
  );
}
