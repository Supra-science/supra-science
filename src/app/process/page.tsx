import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "How we work",
  description:
    "The Supra-Science delivery methodology: consultation, scoping, quotation, design and build, testing, handover, and support.",
  alternates: {
    canonical: "/process",
    languages: { en: "/en/process", ar: "/ar/process", "x-default": "/ar/process" },
  },
};

const PHASES = [
  {
    n: "01",
    title: "Consultation",
    text: "You describe the problem, the goal, and the constraints — in a call, over WhatsApp, or through the consultation form. We ask the decisive questions that determine whether the project is feasible and whether we are the team best able to deliver it.",
    out: "A shared understanding of the problem.",
  },
  {
    n: "02",
    title: "Requirements & feasibility",
    text: "We turn the conversation into binding written requirements: what the system must do, what it must not do, the environment it runs in, and the data it handles. For AI and hardware work, we state openly what the technology can and cannot reliably deliver — without exaggeration.",
    out: "A requirements document you approve.",
  },
  {
    n: "03",
    title: "Scope, timeline & quotation",
    text: "You receive a binding written scope: deliverables, timeline, price, what is included, what is excluded, and payment terms. Nothing starts until you approve it. Quotations are reviewed by an experienced human — never auto-generated as final.",
    out: "A signed-off scope and quotation.",
  },
  {
    n: "04",
    title: "Design & prototyping",
    text: "Architecture, interface design, and early prototypes — before the code is written. For embedded work this means firmware and sensor prototypes you can see and test yourself; for software, working increments you can click through.",
    out: "Designs and prototypes for your review.",
  },
  {
    n: "05",
    title: "Build & review checkpoints",
    text: "Development proceeds through binding checkpoints. You see progress at defined milestones and can correct course early — not at the end, when it is too late.",
    out: "Working system, reviewed in stages.",
  },
  {
    n: "06",
    title: "Testing & delivery",
    text: "Rigorous functional testing against the approved requirements, then handover: deployment, source code, and complete documentation. Prototypes ship with a test report and a documented list of limits.",
    out: "A tested, documented, delivered system.",
  },
  {
    n: "07",
    title: "Support",
    text: "An agreed support window after delivery for fixes and questions — we stay with you after handover. Longer maintenance or further phases are quoted separately — never assumed.",
    out: "Defined post-delivery support.",
  },
];

export default function ProcessPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard">
        <div className="eyebrow">Methodology</div>
        <h1 style={{ fontSize: 44 }}>
          How we <span className="gold">work.</span>
        </h1>
        <p className="lead">
          Seven phases, each with a clear output you approve before we move
          on. No surprises, no scope creep by accident, no &ldquo;we thought
          you meant&rdquo; at delivery — a methodology that carries your project from idea to a
          working system.
        </p>
        <div style={{ marginTop: 32 }}>
          {PHASES.map((p) => (
            <section key={p.n} className="panel" style={{ marginBottom: 18 }}>
              <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div className="eyebrow" style={{ fontSize: 14, minWidth: 40 }}>{p.n}</div>
                <div style={{ flex: "1 1 320px" }}>
                  <h2 style={{ fontSize: 26, margin: "0 0 10px" }}>{p.title}</h2>
                  <p className="lead" style={{ fontSize: 15 }}>{p.text}</p>
                  <p style={{ fontSize: 13, marginBottom: 0 }}>
                    <span className="gold">Output: </span>
                    <span className="muted">{p.out}</span>
                  </p>
                </div>
              </div>
            </section>
          ))}
        </div>
        <div className="panel" style={{ textAlign: "center", padding: "40px 30px" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 12px" }}>
            Start at <span className="gold">phase 01.</span>
          </h2>
          <p className="lead" style={{ margin: "0 auto 22px", maxWidth: 560 }}>
            Every project begins with a consultation. Describe your idea — we
            lead the rest of the process through to delivery.
          </p>
          <Link className="btn" href="/contact">
            Request a consultation
          </Link>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
