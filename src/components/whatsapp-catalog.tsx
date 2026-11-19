import Link from "next/link";
import type { Service } from "@/lib/services";
import { WHATSAPP_NUMBER, WHATSAPP_DISPLAY } from "@/lib/whatsapp-links";
import {
  CATALOG,
  SAMPLES,
  CAT_STEPS,
  CATALOG_STRINGS,
} from "@/lib/whatsapp-catalog";

/**
 * WhatsApp Business catalog section + illustrative work samples.
 *
 * Server component rendered on the Services pages (EN + AR). Content
 * matches the catalog approved by the owner in the Muse space: the five
 * services as catalog cards SS-01..SS-05, four ordering steps, one
 * clearly-labelled hypothetical sample per service. No prices are
 * invented anywhere — the price line always says the price is set by
 * quotation after a scope review. The "Request on WhatsApp" buttons
 * open a wa.me deep link with a pre-filled message; the visitor
 * presses send themselves (nothing is sent by us).
 */

export function WhatsAppCatalog({
  lang,
  services,
}: {
  lang: "en" | "ar";
  services: Service[];
}) {
  const t = CATALOG_STRINGS[lang];
  const items = CATALOG[lang];
  const samples = SAMPLES[lang];
  const steps = CAT_STEPS[lang];
  const ar = lang === "ar";

  return (
    <section id="catalog" style={{ scrollMarginTop: 90, marginTop: 8 }}>
      <div className="eyebrow">{t.eyebrow}</div>
      <h2 style={{ fontSize: 34, margin: "12px 0", lineHeight: 1.5 }}>
        {t.headingLead} <span className="gold">{t.headingGold}</span>
      </h2>
      <p className="lead">{t.lead}</p>

      <div className="panel" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 21, margin: "0 0 8px" }}>{t.howTitle}</h3>
        <p className="muted" style={{ margin: "0 0 18px" }}>{t.howText}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a
            className="btn"
            href="https://wa.me/c/19178183426"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.openCatalog}
          </a>
          <a
            className="btn secondary"
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.startChat}
          </a>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "14px 0 0" }} dir="ltr">
          wa.me/c/19178183426 · {WHATSAPP_DISPLAY}
        </p>
      </div>

      <div className="panel" style={{ marginBottom: 18 }}>
        <h3 style={{ fontSize: 18, margin: "0 0 12px" }}>{t.stepsLabel}</h3>
        <ol className="muted" style={{ margin: 0, paddingInlineStart: 22, lineHeight: 2 }}>
          {steps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 14,
          marginBottom: 32,
        }}
      >
        {items.map((c, idx) => {
          const service = services[idx];
          const title = service ? service.title : c.code;
          const waText = encodeURIComponent(
            `${t.waIntro}\n${t.itemLabel}: ${c.code} — ${title}`
          );
          return (
            <article key={c.code} className="tile" style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10 }}>
                <span className="gold" style={{ fontWeight: 800 }}>{c.code}</span>
                <span className="muted" style={{ fontSize: 12.5 }}>{c.tag}</span>
              </div>
              <h3 style={{ margin: "0 0 8px", fontSize: 19 }}>{title}</h3>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.8, margin: "0 0 12px" }}>
                {c.short}
              </p>
              <h4 style={{ margin: "0 0 6px", fontSize: 14 }}>{t.includesLabel}</h4>
              <ul className="muted" style={{ paddingInlineStart: 18, margin: "0 0 12px", lineHeight: 1.9, fontSize: 13.5 }}>
                {c.includes.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="muted" style={{ fontSize: 13.5, margin: "0 0 14px" }}>
                <strong>{t.priceLabel}</strong>
                {t.priceText}
              </p>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: "auto" }}>
                <a
                  className="btn"
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.inquire}
                </a>
                {service && (
                  <Link className="btn secondary" href={`#${service.id}`}>
                    {t.details}
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>

      <div className="eyebrow">{t.sampleEyebrow}</div>
      <h3 style={{ fontSize: 26, margin: "12px 0", lineHeight: 1.5 }}>
        {t.sampleHeadingLead} <span className="gold">{t.sampleHeadingGold}</span>
      </h3>
      <p className="lead" style={{ fontSize: 15 }}>{t.sampleLead}</p>
      <div
        className="panel"
        style={{ marginBottom: 18, borderStyle: "dashed" }}
        role="note"
      >
        <strong>{t.sampleNoteBold} </strong>
        <span className="muted">{t.sampleNote}</span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 14,
        }}
      >
        {samples.map((s, idx) => {
          const item = items[idx];
          return (
            <article key={item.code} className="tile">
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                <span className="gold" style={{ fontWeight: 800 }}>{item.code}</span>
                <span
                  style={{
                    fontSize: 11.5,
                    border: "1px solid var(--gold)",
                    color: "var(--gold2)",
                    borderRadius: 999,
                    padding: "3px 10px",
                  }}
                >
                  {t.sampleBadge}
                </span>
              </div>
              <h3 style={{ margin: "0 0 10px", fontSize: 19 }}>{s.title}</h3>
              <h4 style={{ margin: "0 0 6px", fontSize: 14, color: "var(--gold2)" }}>
                {t.ideaLabel}
              </h4>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.8, margin: "0 0 14px" }}>
                {s.idea}
              </p>
              <div className="tiles-2">
                <div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 14 }}>{t.scopeLabel}</h4>
                  <ul className="muted" style={{ paddingInlineStart: 18, margin: 0, lineHeight: 1.9, fontSize: 13.5 }}>
                    {s.scope.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 style={{ margin: "0 0 6px", fontSize: 14 }}>{t.deliverablesLabel}</h4>
                  <ul className="muted" style={{ paddingInlineStart: 18, margin: 0, lineHeight: 1.9, fontSize: 13.5 }}>
                    {s.deliverables.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="muted" style={{ fontSize: 11.5, margin: "14px 0 0" }}>
                {t.disclaimer}
              </p>
            </article>
          );
        })}
      </div>

      <p className="muted" style={{ marginTop: 18, marginBottom: 0, fontSize: 13 }}>
        {t.bottomNote}
      </p>
    </section>
  );
}
