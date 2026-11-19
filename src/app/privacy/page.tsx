import type { Metadata } from "next";
import { SiteNav, SiteFooter } from "@/components/site-chrome";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Supra-Science collects, uses, and protects your data when you use our website and client portal.",
  alternates: {
    canonical: "/privacy",
    languages: { en: "/en/privacy", ar: "/ar/privacy", "x-default": "/ar/privacy" },
  },
};

export default function PrivacyPage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard" style={{ maxWidth: 860 }}>
        <div className="eyebrow">Legal</div>
        <h1 style={{ fontSize: 44 }}>
          Privacy <span className="gold">Policy</span>
        </h1>
        <p className="muted">Last updated: November 2026. This policy describes how Supra-Science handles your information. It is written for our actual systems.</p>

        <div className="tile" style={{ marginTop: 24 }}>
          <h3>1. What we collect</h3>
          <p className="muted">
            When you contact us or use the client portal, we collect the
            information you provide: your name, email address, phone number,
            company, project descriptions, uploaded files, and messages. If you
            create an account, we store your login credentials securely and
            link your projects, quotations, and conversations to your account.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>2. Why we collect it</h3>
          <p className="muted">
            To respond to your inquiries, prepare scopes and quotations,
            deliver projects, operate the client portal, and communicate about
            your engagements. We do not sell your personal data.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>3. Who can access it</h3>
          <p className="muted">
            Only authorized members of the Supra-Science team. Your portal data
            is isolated by account: other clients cannot see your projects,
            quotations, or messages, and this isolation is enforced
            server-side, not just in the interface.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>4. AI features</h3>
          <p className="muted">
            If you use the AI assistant or architecture generator, your inputs
            are processed to generate responses and may be stored as part of
            your conversation or draft history in your account. Do not submit
            secrets, credentials, or regulated personal data through these
            tools.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>5. Payments</h3>
          <p className="muted">
            Payments are processed through hosted pages of an approved payment
            provider. We never ask for, receive, or store your card numbers.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>6. Retention and your rights</h3>
          <p className="muted">
            We keep project and communication records for as long as needed to
            operate your account and meet legal obligations. You may request a
            copy, correction, or deletion of your personal data at{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>.
            Some records (such as issued quotations and invoices) may need to
            be retained for accounting purposes.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>7. Security</h3>
          <p className="muted">
            We apply authentication checks on every request, role-based access
            control, database-level row isolation, input validation, and rate
            limiting on sensitive endpoints. No system is perfectly secure; we
            monitor and improve continuously.
          </p>
        </div>
        <div className="tile" style={{ marginTop: 12 }}>
          <h3>8. Contact</h3>
          <p className="muted">
            For privacy questions:{" "}
            <a className="gold" href="mailto:Supra-science@proton.me">Supra-science@proton.me</a>.
          </p>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
