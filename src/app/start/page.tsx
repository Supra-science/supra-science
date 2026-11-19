import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { IntakeWizard } from "@/components/intake-wizard";

export const metadata: Metadata = {
  title: "Start your project",
  description:
    "Guided project intake: describe your idea, get a structured summary, and send it via WhatsApp or the contact form.",
  alternates: {
    canonical: "/start",
    languages: { en: "/en/start", ar: "/ar/start", "x-default": "/ar/start" },
  },
};

export default function StartPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard" style={{ paddingTop: 40 }}>
        <h1 style={{ fontSize: 40, textAlign: "center", margin: "0 0 8px" }}>
          Start your <span className="gold">project</span>
        </h1>
        <p className="lead" style={{ textAlign: "center", margin: "0 auto 24px" }}>
          Describe your idea in four steps and get a structured summary — then send it via WhatsApp or the contact form.
        </p>
        <IntakeWizard lang="en" />
        <p className="muted" style={{ textAlign: "center", marginTop: 18, fontSize: 13 }}>
          Prefer talking to a human first? <Link className="gold" href="/contact">Contact us directly →</Link>
        </p>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
