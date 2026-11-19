import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Talk to Supra-Science about your project — email, WhatsApp, or Google Meet. We reply in English and Arabic.",
  alternates: {
    canonical: "/contact",
    languages: { en: "/en/contact", ar: "/ar/contact", "x-default": "/ar/contact" },
  },
};

const BUSINESS_EMAIL = "Supra-science@proton.me";

export default function ContactPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />

      <section className="hero" style={{ alignItems: "start" }}>
        <div>
          <div className="eyebrow">Contact</div>
          <h1>Talk to <span className="gold">Supra-Science</span></h1>
          <p className="lead">
            Tell us about your project — and the people building it will reply, in English and Arabic —
            <span lang="ar"> نرد بالعربية والإنجليزية</span>.
          </p>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 16 }}>
            <a className="btn secondary" href={`mailto:${BUSINESS_EMAIL}`}>{BUSINESS_EMAIL}</a>
            <a className="btn secondary" href="https://wa.me/19178183426">WhatsApp: +1 (917) 818-3426</a>
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Inside Yemen:{" "}
            <a className="gold" href="https://wa.me/967770601092">WhatsApp +967 770 601 092</a>
          </p>
        </div>

        <div className="panel">
          <ContactForm lang="en" />
        </div>
      </section>

      <SiteFooter lang="en" />
    </main>
  );
}
