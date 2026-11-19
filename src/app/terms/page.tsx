import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms governing use of the Supra-Science website, client portal, quotations, and project engagements.",
  alternates: {
    canonical: "/terms",
    languages: { en: "/en/terms", ar: "/ar/terms", "x-default": "/ar/terms" },
  },
};

export default function TermsPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">Legal</div>
        <h1 style={{ fontSize: 44 }}>
          Terms &amp; <span className="gold">Conditions</span>
        </h1>
        <p className="muted">Last updated: November 2026. These terms govern your use of the Supra-Science website and client portal. Project-specific terms are defined in each approved scope and quotation, which take precedence for that engagement.</p>

        <div className="tile" style={{ marginTop: 24 }}>
          <h3>1. Services</h3>
          <p className="muted">
            Supra-Science provides software, AI, embedded/IoT, scientific
            prototyping, and business-automation services as described on the{" "}
            services page. Each engagement is defined by a written scope,
            timeline, and quotation that you approve before work begins.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>2. Quotations and payment</h3>
          <p className="muted">
            Quotations state the price, what is included and excluded, the
            timeline, validity period, and payment terms. A quotation becomes
            binding when you accept it in writing. Payments are made through
            hosted pages of an approved provider; we never collect card details
            directly.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>3. AI-generated content</h3>
          <p className="muted">
            Architecture drafts and assistant responses are preliminary working
            documents, clearly labeled as drafts. They are not approved
            engineering designs, and must not be treated as certified,
            safety-critical, or medically-validated designs without review by a
            qualified professional and appropriate testing.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>4. Prototypes and limitations</h3>
          <p className="muted">
            Hardware and scientific prototypes are delivered with documented
            capabilities and limits. They are not certified medical devices and
            are not suitable for clinical diagnosis or safety-critical use
            unless explicitly certified and documented as such.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>5. Intellectual property</h3>
          <p className="muted">
            Upon full payment and handover, you receive the deliverables
            defined in your scope, including source code and documentation, as
            stated in the approved scope. Pre-existing tools, libraries, and
            platform components remain the property of their respective owners.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>6. Acceptable use</h3>
          <p className="muted">
            You agree not to misuse the portal, attempt unauthorized access,
            interfere with other users&apos; data, or submit unlawful content.
            We may suspend accounts that violate these terms.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>7. Liability</h3>
          <p className="muted">
            We deliver professional engineering work with reasonable care, but
            we do not guarantee specific business outcomes. Our liability for
            an engagement is limited to the fees paid for that engagement,
            except where the law does not permit such limitation.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>8. Contact</h3>
          <p className="muted">
            Questions about these terms:{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>.
          </p>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
