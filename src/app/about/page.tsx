import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "About",
  description:
    "Supra-Science is an engineering practice led by experience, building software, AI systems, embedded devices, and scientific prototypes — and delivering them as working systems. Learn how we work and how to reach us.",
  alternates: {
    canonical: "/about",
    languages: { en: "/en/about", ar: "/ar/about", "x-default": "/ar/about" },
  },
};

export default function AboutPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard">
        <div className="eyebrow">About</div>
        <h1 style={{ fontSize: 44 }}>
          An engineering practice led by experience, <span className="gold">not a template.</span>
        </h1>
        <p className="lead">
          Supra-Science is a technology and engineering practice with one
          purpose: turning ideas into working systems that are delivered and
          that work. We design and build software, artificial-intelligence
          solutions, connected devices, and scientific technology prototypes
          — and we stay accountable for them from the first conversation to
          handover and beyond.
        </p>

        <div className="panel" style={{ marginTop: 28 }}>
          <div className="eyebrow">How we think</div>
          <h2 style={{ fontSize: 28, margin: "12px 0" }}>
            Software, intelligence, and hardware — <span className="gold">one system, one leadership.</span>
          </h2>
          <p className="lead" style={{ fontSize: 15 }}>
            Most technology projects collapse at the boundary between
            disciplines: an app that doesn&apos;t match the device, a model
            that doesn&apos;t fit the workflow, a prototype that never becomes
            a product. We work across that boundary deliberately and with
            experience. The application, the intelligence, and the hardware
            are designed together, scoped together, and delivered together —
            as one working system.
          </p>
        </div>

        <div className="tiles" style={{ marginTop: 24 }}>
          <article className="tile">
            <h3>What we do</h3>
            <p className="muted">
              Digital products and applications, software and AI systems,
              embedded devices and IoT, scientific and medical-technology
              prototypes, and business automation with WhatsApp integration.{" "}
              <Link className="gold" href="/services">See services →</Link>
            </p>
          </article>
          <article className="tile">
            <h3>How we work</h3>
            <p className="muted">
              Consultation first, then a written scope with timeline and
              quotation. Review checkpoints during the build, rigorous testing
              before delivery, and complete documentation at handover.{" "}
              <Link className="gold" href="/process">Our methodology →</Link>
            </p>
          </article>
          <article className="tile">
            <h3>What we will not do</h3>
            <p className="muted">
              We will not invent prices, testimonials, clients, or
              certifications. We will not present a prototype as a certified
              medical device or a draft as an approved design. What we claim,
              we can show.
            </p>
          </article>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", gap: 28, alignItems: "center", flexWrap: "wrap" }}>
            <img
              className="leader-photo"
              src="/leadership/dr-faisal-alradaei.webp"
              alt="Dr. Faisal Alradaei"
              width={600}
              height={600}
            />
            <div style={{ flex: "1 1 300px" }}>
              <div className="eyebrow">Leadership</div>
              <h2 style={{ fontSize: 30, margin: "12px 0 4px" }}>
                Dr. Faisal Alradaei
              </h2>
              <p className="gold" style={{ fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>
                Director, Supra-Science
              </p>
            </div>
          </div>
          <p className="lead" style={{ fontSize: 15, marginTop: 18 }}>
            Dr. Faisal Alradaei leads Supra-Science, combining engineering
            practice with a background in medical sciences — which is why our
            scientific and medical prototypes are built with uncommon rigour
            in measurement quality and honest documentation of limits.
          </p>
        </div>

        <div className="panel" style={{ marginTop: 24, textAlign: "center", padding: "40px 30px" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 12px" }}>
            Work with <span className="gold">us.</span>
          </h2>
          <p className="lead" style={{ margin: "0 auto 22px", maxWidth: 560 }}>
            The fastest way to start is a consultation: describe your problem,
            and we will tell you plainly whether it is within our capability
            — and if it is not, we will tell you that too.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link className="btn" href="/contact">
              Request a consultation
            </Link>
            <a className="btn secondary" href="https://wa.me/19178183426">
              WhatsApp
            </a>
          </div>
          <p className="muted" style={{ marginTop: 18 }}>
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>
          </p>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
