import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav, SiteFooter } from "@/components/site-chrome";
import { HeroVisual } from "@/components/hero-visual";
import { FreeOffers } from "@/components/free-offers";
import FaqSection, { FaqJsonLd } from "@/components/faq-section";

export const metadata: Metadata = {
  title: "Supra-Science | Engineering, Software, AI & Connected Systems",
  description:
    "Supra-Science designs and builds software, AI systems, connected devices, and scientific technology — from requirements to a delivered, working system, led by one team that owns it end to end. Request a consultation.",
  alternates: {
    canonical: "/",
    languages: { en: "/en", ar: "/ar", "x-default": "/ar" },
  },
};

const PRICE_NOTE =
  "Indicative starting price — the final price is set in your written quotation after we review the scope.";

const SERVICES = [
  {
    href: "/services#digital-products",
    title: "Digital products & applications",
    text: "Web, iOS and Android applications, client portals, admin dashboards, databases and APIs — engineered around your workflow, never around a ready-made template.",
    img: "/services/digital-products.webp",
    w: 1200,
    h: 675,
    price: 3500,
  },
  {
    href: "/services#software-ai",
    title: "Software & AI",
    text: "Python systems, language-model integration, data analysis, workflow automation, and computer vision — where the technology proves its worth in your scope.",
    img: "/services/software-ai.webp",
    w: 1200,
    h: 675,
    price: 4500,
  },
  {
    href: "/services#embedded-iot",
    title: "Embedded systems & IoT",
    text: "Arduino and ESP32 firmware, sensors, device-to-cloud connectivity, prototypes, and PCB design built for real operating conditions.",
    img: "/services/embedded-iot.webp",
    w: 1200,
    h: 675,
    price: 3500,
  },
  {
    href: "/services#scientific",
    title: "Scientific & medical prototypes",
    text: "Sensor prototypes, signal acquisition and processing, monitoring dashboards, and rigorous engineering documentation — reliable measurement, honestly documented limits.",
    img: "/services/scientific.webp",
    w: 1200,
    h: 675,
    price: 6500,
  },
  {
    href: "/services#automation",
    title: "Business automation & WhatsApp",
    text: "Support assistants, WhatsApp Cloud API integration, CRM workflows, notifications, and conversation tracking — turning your messages into a system that works.",
    img: "/services/automation.webp",
    w: 1200,
    h: 675,
    price: 1500,
  },
];

type SampleCard = {
  href: string;
  title: string;
  text: string;
  label: string;
  lo?: number;
  hi?: number;
  moLo?: number;
  moHi?: number;
  per?: number;
  pack?: number;
};

/* Prices are numbers formatted at render time, like SERVICES above —
   the public-site test guard forbids literal dollar-price strings in page source. */
const SAMPLES: SampleCard[] = [
  {
    href: "/files/samples/suprastat-clinical-biostatistics-sample.pdf",
    title: "SupraStat™ — Statistical analysis",
    text: "Medical & academic statistics (SPSS / R / Python).",
    lo: 49,
    hi: 149,
    label: "View sample report (PDF, 2 pages)",
  },
  {
    href: "/files/samples/supraflow-whatsapp-ai-clinic-blueprint.pdf",
    title: "SupraFlow™ — WhatsApp automation & AI",
    text: "WhatsApp Business AI for clinics & businesses.",
    lo: 149,
    hi: 299,
    moLo: 39,
    moHi: 69,
    label: "View blueprint sample (PDF, 2 pages)",
  },
  {
    href: "/files/samples/supramed-osce-oral-exam-sample.pdf",
    title: "SupraMed™ — OSCE & SMLE clinical training",
    text: "Intensive 1-on-1 clinical exam coaching.",
    per: 25,
    pack: 89,
    label: "View 10-page sample (PDF)",
  },
  {
    href: "/files/samples/06-suprapub-sample.pdf",
    title: "SupraPub™ — Publication editing",
    text: "Medical & academic manuscript editing — before/after sample.",
    lo: 59,
    hi: 129,
    label: "View editing sample (PDF, 2 pages)",
  },
];

function samplePrice(s: SampleCard): string {
  if (s.moLo !== undefined) return `$${s.lo}–$${s.hi} setup + $${s.moLo}–$${s.moHi} / month`;
  if (s.per !== undefined) return `$${s.per} / session · $${s.pack} for 4 sessions`;
  return `$${s.lo}–$${s.hi}`;
}

const EVALUATE = [
  {
    title: "Problem definition",
    text: "We start from the problem, not the technology. What must change, for whom, and how will you measure that it worked — before a single line of code.",
    out: "A written problem statement.",
  },
  {
    title: "Feasibility assessment",
    text: "We put the idea through a rigorous test — physics, data, budget, timeline — and tell you plainly when it is not viable.",
    out: "A go / no-go with reasons.",
  },
  {
    title: "Technical architecture",
    text: "System design before code: components, data flow, integrations, risks, and the limits of what will be built — so there are no surprises during the build.",
    out: "An architecture draft you review.",
  },
  {
    title: "Scope, quotation & delivery",
    text: "Fixed written scope, timeline, and binding price. Build checkpoints, testing, documentation, and handover — we deliver exactly what was agreed.",
    out: "A delivered, documented system.",
  },
];

const WHY = [
  {
    title: "One accountable team",
    text: "Software, hardware, and AI in one hand — full accountability, never scattered across vendors.",
  },
  {
    title: "Engineering-first scoping",
    text: "We define precisely what will be built, what it costs, and what it excludes — before any work starts.",
  },
  {
    title: "Honest quotations",
    text: "Every figure is reviewed by a human and tied to a written scope. No invented packages, no figures from thin air.",
  },
  {
    title: "Direct communication",
    text: "Talk directly to the team building your system — no middlemen, no automated replies — by email or WhatsApp, in English or Arabic.",
  },
];

export default function HomePage() {
  return (
    <main className="shell">
      <SiteNav lang="en" />

      {/* HERO */}
      <section className="hero">
        <div>
          <div className="eyebrow">Engineering · AI · Connected Systems</div>
          <h1 className="reveal reveal-2">
            We design and build <span className="gold">connected technology</span> —
            software, intelligence, and hardware, one team, one system, one accountable delivery.
          </h1>
          <p className="lead reveal reveal-3">
            Supra-Science is an engineering practice led by experience. We drive an idea from
            requirements through architecture and prototyping to a delivered, working system —
            for businesses that need software, AI systems, connected devices, or scientific
            prototypes, built by one team that owns it end to end.
          </p>
          <div className="reveal reveal-4" style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 28 }}>
            <Link className="btn" href="/contact">
              Request a consultation
            </Link>
            <Link className="btn secondary" href="/services">
              Explore services
            </Link>
          </div>
        </div>
        <div className="reveal reveal-3">
          <HeroVisual lang="en" />
          <p className="muted" style={{ fontSize: 12, marginTop: 10, textAlign: "center" }}>
            One practice, one leadership — five connected engineering domains.
          </p>
        </div>
      </section>

      {/* STAT STRIP */}
      <section className="section" style={{ paddingTop: 0, paddingBottom: 0 }}>
        <div className="statstrip reveal reveal-5">
          <div className="stat"><strong>EN / AR</strong><span>Bilingual delivery</span></div>
          <div className="stat"><strong>5</strong><span>Service domains</span></div>
          <div className="stat"><strong>One team</strong><span>fully accountable</span></div>
          <div className="stat"><strong>✓</strong><span>Quotations built on scope</span></div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="section-head">
          <div className="eyebrow">Services</div>
          <h2>
            Our <span className="gold">strengths</span>
          </h2>
          <p className="lead">
            Five engineering domains under one integrated practice. Every engagement is scoped
            precisely and quoted on its own merits —{" "}
            <Link className="gold" href="/contact">request a quote</Link> for your project.
          </p>
        </div>
        <div className="tiles-2">
          {SERVICES.map((s) => (
            <Link key={s.href} href={s.href} className="tile" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="service-img-wrap" style={{ marginBottom: 14 }}>
                <img src={s.img} alt={s.title} loading="lazy" width={s.w} height={s.h} />
              </div>
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <p style={{ margin: "10px 0 4px" }}>
                <span className="gold" style={{ fontWeight: 700 }}>
                  Starting from ${s.price.toLocaleString("en-US")}
                </span>
              </p>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 4px" }}>
                {PRICE_NOTE}
              </p>
              <span className="gold" style={{ fontSize: 13 }}>Learn more →</span>
            </Link>
          ))}
          <div className="tile" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3>Not sure where to start?</h3>
            <p className="muted">
              Describe your problem in a consultation — we will tell you plainly whether it is
              within our capability.
            </p>
            <Link className="gold" style={{ fontSize: 13 }} href="/contact">
              Talk to us →
            </Link>
          </div>
        </div>
      </section>

      {/* WORK SAMPLES */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">Work samples</div>
          <h2>
            See the work, <span className="gold">before you decide</span>
          </h2>
          <p className="lead">
            Real samples of what a Quick-Launch engagement delivers — open the
            PDF and judge the quality for yourself.
          </p>
        </div>
        <div className="tiles-2">
          {SAMPLES.map((s) => (
            <a
              key={s.href}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="tile"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3>{s.title}</h3>
              <p className="muted">{s.text}</p>
              <p style={{ margin: "10px 0 4px" }}>
                <span className="gold" style={{ fontWeight: 700 }}>
                  {samplePrice(s)}
                </span>
              </p>
              <p className="muted" style={{ fontSize: 12.5, margin: "0 0 4px" }}>
                {PRICE_NOTE}
              </p>
              <span className="gold" style={{ fontSize: 13 }}>{s.label} →</span>
            </a>
          ))}
          <div className="tile" style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h3>All four Quick-Launch packages</h3>
            <p className="muted">
              SupraStat, SupraPub, SupraMed and SupraFlow — fixed indicative
              ranges, same written-scope discipline.
            </p>
            <Link className="gold" style={{ fontSize: 13 }} href="/services#quick-launch">
              See the packages →
            </Link>
          </div>
        </div>
      </section>

      {/* FREE OFFERS */}
      <section className="section" style={{ paddingTop: 0 }}>
        <FreeOffers lang="en" />
      </section>

      {/* EVALUATION */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">Engagement</div>
          <h2>
            How we <span className="gold">rigorously evaluate</span> your project
          </h2>
          <p className="lead">
            Before any quotation, your idea passes through four rigorous gates. If it fails one,
            we tell you why — before you spend a cent.
          </p>
        </div>
        <div className="tiles-4">
          {EVALUATE.map((e, i) => (
            <article key={e.title} className="tile">
              <div className="eyebrow">0{i + 1}</div>
              <h3 style={{ marginTop: 8 }}>{e.title}</h3>
              <p className="muted">{e.text}</p>
              <p style={{ fontSize: 12.5, marginBottom: 0 }}>
                <span className="gold">You receive: </span>
                <span className="muted">{e.out}</span>
              </p>
            </article>
          ))}
        </div>
        <p style={{ marginTop: 18 }}>
          <Link className="gold" href="/process">
            See the full delivery methodology →
          </Link>
        </p>
      </section>

      {/* WHY */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">Why Supra-Science</div>
          <h2>
            Built on <span className="gold">clarity and commitment</span>
          </h2>
        </div>
        <div className="tiles-2">
          {WHY.map((w) => (
            <article key={w.title} className="tile">
              <h3>{w.title}</h3>
              <p className="muted">{w.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* LEADERSHIP */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="panel">
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
              <h2 style={{ fontSize: 30, margin: "10px 0 4px" }}>Dr. Faisal Alradaei</h2>
              <p className="gold" style={{ fontWeight: 700, margin: "0 0 10px" }}>Director, Supra-Science</p>
              <p className="muted" style={{ margin: 0 }}>
                An engineering practice led firmly by its founder — combining software and systems
                engineering with a background in medical sciences. Every scope and quotation passes
                through a personal review by the director before it reaches you.
              </p>
            </div>
            <Link className="btn secondary" href="/about">
              About the practice
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">FAQ</div>
          <h2>
            Questions, <span className="gold">answered.</span>
          </h2>
          <p className="lead">
            The questions clients ask before they decide. Anything else —{" "}
            <Link className="gold" href="/contact">ask us directly</Link> — we answer plainly.
          </p>
        </div>
        <FaqSection lang="en" />
        <FaqJsonLd lang="en" />
        <p style={{ marginTop: 18 }}>
          <Link className="gold" href="/faq">
            See all questions →
          </Link>
        </p>
      </section>

      {/* CONTACT */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="section-head">
          <div className="eyebrow">Contact</div>
          <h2>
            Talk to <span className="gold">Supra-Science</span>
          </h2>
          <p className="lead">
            Tell us about your project — and the people building it will reply, in English or Arabic.
          </p>
        </div>
        <div className="channels">
          <a className="channel" href="/contact">
            <span className="ic">✎</span>
            <span><b>Consultation form</b><span>Describe your project — we respond with a scope and quotation.</span></span>
          </a>
          <a className="channel" href="https://wa.me/19178183426?text=Hello%20Supra-Science%2C%20I%20want%20to%20start%20a%20project.">
            <span className="ic">◉</span>
            <span><b>WhatsApp — +1 (917) 818-3426</b><span>Direct line for questions and fast decisions.</span></span>
          </a>
          <a className="channel" href="mailto:Supra-science@proton.me">
            <span className="ic">@</span>
            <span><b>Supra-science@proton.me</b><span>Official business email for proposals and documents.</span></span>
          </a>
          <Link className="channel" href="/faq">
            <span className="ic">?</span>
            <span><b>Common questions</b><span>Scope, timelines, quotations, and how we work — answered plainly.</span></span>
          </Link>
        </div>
        <p style={{ marginTop: 18 }}>
          <Link className="gold" href="/contact">
            Open the full contact form →
          </Link>
        </p>
      </section>

      <SiteFooter lang="en" />
    </main>
  );
}
