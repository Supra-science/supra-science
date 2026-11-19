import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description:
    "Clear milestone-based refund, cancellation, and revision terms for Supra-Science engineering and scientific services.",
  alternates: {
    canonical: "/refund",
    languages: { en: "/en/refund", ar: "/ar/refund", "x-default": "/ar/refund" },
  },
};

export default function RefundPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">Legal</div>
        <h1 style={{ fontSize: 44 }}>
          Refund &amp; <span className="gold">Cancellation Policy</span>
        </h1>
        <p className="muted">Last updated: November 2026. Every project and service package at Supra-Science is governed by a written scope and quotation confirmed before payment. This policy protects both client funds and engineering commitment.</p>

        <div className="tile" style={{ marginTop: 24 }}>
          <h3>1. Full refund before execution starts</h3>
          <p className="muted">
            If you cancel before technical execution, statistical analysis, or
            live mentoring begins — or if Supra-Science fails to deliver
            within the agreed written deadline without a prior client-approved
            extension — 100% of your deposit is refunded, less any
            third-party transfer fees.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>2. Milestone-based protection</h3>
          <p className="muted">
            For multi-milestone engineering, software, or research projects,
            payments are tied to verifiable milestones. If a project is
            cancelled mid-execution, completed and approved milestones are
            non-refundable, while any unearned balance for future milestones
            is refunded in full.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>3. Free scope-alignment revisions</h3>
          <p className="muted">
            All packages include up to two (2) complimentary revision rounds
            within 7 days of delivery, to ensure full compliance with the
            initial written scope.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>4. Final source handover</h3>
          <p className="muted">
            Once final editable files (source code, raw scripts, editable
            manuscripts, or downloadable digital study vaults) have been
            released following preview approval, the completed milestone is
            final and non-refundable.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>5. How to request a cancellation or refund</h3>
          <p className="muted">
            Contact{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>{" "}
            or message{" "}
            <a className="gold" href="https://wa.me/19178183426">+1 (917) 818-3426</a>{" "}
            with your quotation reference number. Refunds are returned through
            the same channel used for payment where possible.
          </p>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
