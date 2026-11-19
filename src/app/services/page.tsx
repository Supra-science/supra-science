import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { getServices, quickLaunch, type Service, type QuickLaunchPackage } from "@/lib/services";
import { WhatsAppRequest } from "@/components/whatsapp-request";
import { WhatsAppCatalog } from "@/components/whatsapp-catalog";
import { FreeOffers } from "@/components/free-offers";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Supra-Science services: digital products and applications, software and AI, embedded systems and IoT, scientific and medical prototypes, business automation and WhatsApp integration. Request a quote.",
  alternates: {
    canonical: "/services",
    languages: { en: "/en/services", ar: "/ar/services", "x-default": "/ar/services" },
  },
};


function ServiceBlock({ s }: { s: Service }) {
  return (
    <section id={s.id} className="panel" style={{ marginBottom: 24, scrollMarginTop: 90 }}>
      <div className="eyebrow">Service</div>
      <h2 style={{ fontSize: 30, margin: "12px 0" }}>{s.title}</h2>
      {s.image && (
        <div className="service-img-wrap" style={{ marginBottom: 16 }}>
          <img
            src={s.image}
            alt={s.title}
            loading="lazy"
            width={s.imageWidth}
            height={s.imageHeight}
          />
        </div>
      )}
      {s.startingPriceUsd !== undefined && (
        <div
          style={{
            display: "flex",
            gap: 14,
            alignItems: "baseline",
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <span className="price-tag">
            Starting from ${s.startingPriceUsd.toLocaleString("en-US")}
          </span>
          <span className="muted" style={{ fontSize: 12.5 }}>
            {s.priceNote}
          </span>
        </div>
      )}
      <p style={{ fontSize: 15, lineHeight: 1.8 }}>
        <strong className="gold">The problem: </strong>
        {s.problem}
      </p>
      <p className="lead" style={{ fontSize: 15 }}>{s.description}</p>
      <div className="tiles-2" style={{ marginTop: 18 }}>
        <div className="tile">
          <h3>Scope of work</h3>
          <ul className="muted" style={{ paddingInlineStart: 18, margin: 0, lineHeight: 1.9 }}>
            {s.scope.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
        <div className="tile">
          <h3>Technologies</h3>
          <p className="muted">{s.technologies}</p>
          <h3 style={{ marginTop: 16 }}>Deliverables</h3>
          <p className="muted">{s.deliverables}</p>
        </div>
      </div>
      <div className="tile" style={{ marginTop: 16, borderStyle: "dashed" }}>
        <h3>Typical applications</h3>
        <ul className="muted" style={{ paddingInlineStart: 18, margin: "0 0 8px", lineHeight: 1.9 }}>
          {s.examples.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 11.5, marginBottom: 0 }}>
          Illustrative application types — not client work or completed projects.
        </p>
      </div>
      <div className="tile" style={{ marginTop: 16 }}>
        <h3>What we need from you</h3>
        <p className="muted" style={{ marginBottom: 14 }}>{s.needFromYou}</p>
        <Link className="btn" href="/contact">
          Request a quote
        </Link>
        <WhatsAppRequest serviceTitle={s.title} lang="en" />
      </div>
    </section>
  );
}

/**
 * Quick-Launch Scientific & AI Packages (added 2026-11-14, founder
 * decision 1): fast-decision packages for medical students, residents,
 * and researchers — an addition below the five engineering services,
 * never a replacement. Prices are the approved indicative ranges.
 */
function QuickLaunchSection({ packages }: { packages: QuickLaunchPackage[] }) {
  return (
    <section id="quick-launch" className="panel" style={{ marginBottom: 24, scrollMarginTop: 90 }}>
      <div className="eyebrow">Quick-Launch · New</div>
      <h2 style={{ fontSize: 30, margin: "12px 0" }}>
        Quick-Launch Scientific &amp; <span className="gold">AI Packages</span>
      </h2>
      <p className="lead">
        Fast-decision packages for researchers, doctors, and clinics — fixed
        indicative ranges, same written-scope discipline as every Supra-Science
        engagement. The final price is set in your written quotation after we
        review the scope.
      </p>
      {packages.map((p) => (
        <div key={p.id} className="tile" style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 21 }}>{p.title}</h3>
          <p className="muted" style={{ margin: "4px 0 12px" }}>{p.tagline}</p>
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "baseline",
              flexWrap: "wrap",
              marginBottom: 12,
            }}
          >
            <span className="price-tag">{p.priceRange}</span>
            <span className="muted" style={{ fontSize: 12.5 }}>
              {p.priceNote}
            </span>
          </div>
          {p.tiers && (
            <ul className="muted" style={{ paddingInlineStart: 18, margin: "0 0 12px", lineHeight: 1.9 }}>
              {p.tiers.map((t) => (
                <li key={t.name}>
                  <strong>{t.name} — {t.price}: </strong>
                  {t.includes} · {t.revisions}
                </li>
              ))}
            </ul>
          )}
          <p style={{ fontSize: 15, lineHeight: 1.8 }}>
            <strong className="gold">Who it is for: </strong>
            {p.audience}
          </p>
          <ul className="muted" style={{ paddingInlineStart: 18, margin: "0 0 8px", lineHeight: 1.9 }}>
            {p.scope.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p className="muted" style={{ marginBottom: 14 }}>
            <strong>Deliverables: </strong>
            {p.deliverables}
          </p>
          {p.sampleUrl && (
            <p style={{ marginBottom: 14 }}>
              <a
                className="gold"
                href={p.sampleUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {p.sampleLabel ?? "View sample (PDF)"} →
              </a>
            </p>
          )}
          <Link className="btn" href="/contact">
            Request a quote
          </Link>
          <WhatsAppRequest serviceTitle={p.title} lang="en" />
        </div>
      ))}
    </section>
  );
}

export default async function ServicesPage() {
  const SERVICES = await getServices("en");
  const PACKAGES = quickLaunch("en");
  return (
    <main className="shell">
      <SiteNav lang="en" />
      <section className="dashboard">
        <div className="eyebrow">Services</div>
        <h1 style={{ fontSize: 44 }}>
          Engineering services, <span className="gold">scoped with precision and honesty.</span>
        </h1>
        <p className="lead">
          Every service below is a defined engagement in its own right: written scope, timeline,
          and quotation. Each card shows an indicative starting price — the final price is set in
          your written quotation after we review the scope carefully.{" "}
          <Link className="gold" href="/contact">
            Request a quote →
          </Link>
        </p>
        <p className="muted" style={{ maxWidth: 720 }}>
          Note: prototypes and AI systems are delivered as engineering work
          with documented capabilities and limits. We do not claim medical
          certification, clinical-diagnostic suitability, or regulatory
          approval unless proven and documented.
        </p>
        <div style={{ marginTop: 32 }}>
          {SERVICES.map((s) => (
            <ServiceBlock key={s.id} s={s} />
          ))}
        </div>
        <QuickLaunchSection packages={PACKAGES} />
        <WhatsAppCatalog lang="en" services={SERVICES} />
        <FreeOffers lang="en" />
        <div className="panel" style={{ textAlign: "center", padding: "40px 30px" }}>
          <h2 style={{ fontSize: 30, margin: "0 0 12px" }}>
            Your project, <span className="gold">quoted as it deserves.</span>
          </h2>
          <p className="lead" style={{ margin: "0 auto 22px", maxWidth: 560 }}>
            Tell us what you need to build, measure, or automate. We respond
            with a written scope and a clear quotation.
          </p>
          <Link className="btn" href="/contact">
            Start a project
          </Link>
        </div>
      </section>
      <SiteFooter lang="en" />
    </main>
  );
}
