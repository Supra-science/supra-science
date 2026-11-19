import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import FaqSection, { FaqJsonLd } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about working with Supra-Science: scoping, quotations, timelines, AI and hardware projects, communication, and support.",
  alternates: {
    canonical: "/faq",
    languages: { en: "/en/faq", ar: "/ar/faq", "x-default": "/ar/faq" },
  },
};

export default function FaqPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">FAQ</div>
        <h1 style={{ fontSize: 44 }}>
          Questions, <span className="gold">answered.</span>
        </h1>
        <p className="lead">
          The questions clients ask before they decide. Anything else —{" "}
          <Link className="gold" href="/contact">ask us directly</Link> — we answer plainly.
        </p>
        <FaqSection lang="en" />
        <FaqJsonLd lang="en" />
        <div className="panel" style={{ textAlign: "center", padding: "36px 30px", marginTop: 24 }}>
          <h2 style={{ fontSize: 28, margin: "0 0 12px" }}>
            Still have a <span className="gold">question?</span>
          </h2>
          <Link className="btn" href="/contact">
            Contact us
          </Link>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
