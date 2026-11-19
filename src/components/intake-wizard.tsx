"use client";
import { useEffect, useMemo, useState } from "react";
import {
  buildProjectSummary,
  classifyProject,
  DOMAIN_LABELS,
  type IntakeAnswers,
} from "@/lib/intake";
import { serviceRequestLink } from "@/lib/whatsapp-links";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";

/**
 * IntakeWizard — guided project intake (rule-based, zero cost, no AI API).
 * Collects the project description, budget, timeline and contact details,
 * classifies the domain with keyword rules, and lets the visitor send the
 * structured summary via WhatsApp (their own app) or the contact form.
 */
export function IntakeWizard({ lang = "en" }: { lang?: "en" | "ar" }) {
  const ar = lang === "ar";
  useEffect(() => {
    loadRecaptcha();
  }, []);
  const [step, setStep] = useState(0);
  const [a, setA] = useState<IntakeAnswers>({
    description: "",
    budget: "",
    timeline: "",
    contact: "",
    name: "",
    email: "",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const set = (k: keyof IntakeAnswers) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setA((p) => ({ ...p, [k]: e.target.value }));

  const classification = useMemo(() => classifyProject(a.description), [a.description]);
  const summary = useMemo(() => buildProjectSummary(a, lang), [a, lang]);

  const T = {
    title: ar ? "ابدأ مشروعك — استشارة موجّهة" : "Start your project — guided intake",
    sub: ar
      ? "أجب عن أربع خطوات وسنجهز ملخصاً منظماً لمشروعك."
      : "Answer four steps and we will prepare a structured summary of your project.",
    s1: ar ? "١. صف ما تريد بناءه" : "1. Describe what you want to build",
    s1ph: ar ? "مثال: أريد تطبيق جوال لحجوزات عيادة مع تذكير واتساب…" : "Example: I need a mobile app for clinic bookings with WhatsApp reminders…",
    next: ar ? "التالي" : "Next",
    back: ar ? "رجوع" : "Back",
    s2: ar ? "٢. الميزانية والجدول الزمني" : "2. Budget & timeline",
    budget: ar ? "الميزانية التقريبية" : "Approximate budget",
    budgets: ar
      ? ["أقل من 1000$", "1000$ – 5000$", "5000$ – 15000$", "أكثر من 15000$", "غير محدد بعد"]
      : ["Under $1,000", "$1,000 – $5,000", "$5,000 – $15,000", "Over $15,000", "Not decided yet"],
    timeline: ar ? "الجدول الزمني المطلوب" : "Desired timeline",
    timelines: ar
      ? ["أقل من شهر", "1 – 3 أشهر", "3 – 6 أشهر", "مرن"]
      : ["Under a month", "1 – 3 months", "3 – 6 months", "Flexible"],
    contact: ar ? "طريقة التواصل المفضلة" : "Preferred contact method",
    contacts: ar ? ["واتساب", "بريد إلكتروني", "مكالمة"] : ["WhatsApp", "Email", "Call"],
    s3: ar ? "٣. بيانات التواصل" : "3. Your contact details",
    name: ar ? "الاسم" : "Name",
    email: ar ? "البريد الإلكتروني" : "Email",
    s4: ar ? "٤. الملخص والإرسال" : "4. Summary & send",
    domain: ar ? "المجال المقترح" : "Suggested domain",
    conf: ar ? "مستوى الثقة" : "Confidence",
    viaWa: ar ? "إرسال عبر واتساب" : "Send via WhatsApp",
    viaForm: ar ? "إرسال عبر نموذج التواصل" : "Submit via contact form",
    sending: ar ? "جارٍ الإرسال…" : "Sending…",
    needDesc: ar ? "اكتب وصفاً أولاً للمتابعة." : "Write a description first to continue.",
  };

  async function submitForm() {
    setSending(true);
    setResult(null);
    try {
      // reCAPTCHA v3 (added Nov-8, action "intake").
      const recaptchaToken = await getRecaptchaToken("intake");
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: a.name.trim() || "Website visitor",
          email: a.email.trim(),
          subject: "Project intake",
          message: summary.slice(0, 4000),
          preferred_contact: a.contact === (ar ? "واتساب" : "WhatsApp") ? "whatsapp" : "email",
          recaptcha_token: recaptchaToken,
        }),
      });
      const data = await res.json().catch(() => ({}));
      setResult(
        data.ok
          ? data.note || (ar ? "تم الاستلام." : "Received.")
          : (data.error as string) || (ar ? "تعذر الإرسال." : "Could not send.")
      );
    } catch {
      setResult(ar ? "تعذر الإرسال. حاول واتساب." : "Could not send. Try WhatsApp.");
    } finally {
      setSending(false);
    }
  }

  const canNext1 = a.description.trim().length >= 10;

  return (
    <div className="panel" style={{ maxWidth: 760, margin: "0 auto" }}>
      <div className="eyebrow">{ar ? "استشارة موجّهة" : "Guided intake"}</div>
      <h2 style={{ fontSize: 28, margin: "10px 0" }}>{T.title}</h2>
      <p className="muted" style={{ fontSize: 14 }}>{T.sub}</p>

      <div style={{ display: "flex", gap: 8, margin: "18px 0" }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 4,
              background: i <= step ? "var(--gold)" : "rgba(11,36,71,.12)",
            }}
          />
        ))}
      </div>

      {step === 0 && (
        <div>
          <h3>{T.s1}</h3>
          <label className="field">
            <textarea rows={5} value={a.description} onChange={set("description")} placeholder={T.s1ph} maxLength={2000} />
          </label>
          {a.description.trim().length > 0 && (
            <p style={{ fontSize: 13 }}>
              <span className="muted">{T.domain}: </span>
              <span className="gold">{DOMAIN_LABELS[classification.domain][lang]}</span>
              <span className="muted"> · {T.conf}: {classification.confidence}</span>
            </p>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
            <button className="btn" disabled={!canNext1} onClick={() => setStep(1)}>{T.next}</button>
          </div>
          {!canNext1 && <p className="muted" style={{ fontSize: 12 }}>{T.needDesc}</p>}
        </div>
      )}

      {step === 1 && (
        <div>
          <h3>{T.s2}</h3>
          <label className="field" style={{ marginBottom: 12 }}>
            <span>{T.budget}</span>
            <select value={a.budget} onChange={set("budget")}>
              <option value="">—</option>
              {T.budgets.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="field" style={{ marginBottom: 12 }}>
            <span>{T.timeline}</span>
            <select value={a.timeline} onChange={set("timeline")}>
              <option value="">—</option>
              {T.timelines.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{T.contact}</span>
            <select value={a.contact} onChange={set("contact")}>
              <option value="">—</option>
              {T.contacts.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button className="btn secondary" onClick={() => setStep(0)}>{T.back}</button>
            <button className="btn" onClick={() => setStep(2)}>{T.next}</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3>{T.s3}</h3>
          <label className="field" style={{ marginBottom: 12 }}>
            <span>{T.name}</span>
            <input value={a.name} onChange={set("name")} maxLength={80} />
          </label>
          <label className="field">
            <span>{T.email}</span>
            <input type="email" value={a.email} onChange={set("email")} maxLength={120} dir="ltr" style={{ textAlign: ar ? "right" : "left" }} />
          </label>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14 }}>
            <button className="btn secondary" onClick={() => setStep(1)}>{T.back}</button>
            <button className="btn" onClick={() => setStep(3)}>{T.next}</button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3>{T.s4}</h3>
          <p style={{ fontSize: 14 }}>
            <span className="muted">{T.domain}: </span>
            <span className="gold" style={{ fontWeight: 700 }}>{DOMAIN_LABELS[classification.domain][lang]}</span>
          </p>
          <pre className="muted" style={{ fontSize: 12.5, whiteSpace: "pre-wrap", background: "rgba(11,36,71,.04)", padding: 14, borderRadius: 10 }}>
            {summary}
          </pre>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <a className="btn" href={serviceRequestLink(summary)} target="_blank" rel="noopener noreferrer">
              {T.viaWa} ↗
            </a>
            <button className="btn secondary" disabled={sending} onClick={submitForm}>
              {sending ? T.sending : T.viaForm}
            </button>
            <button className="btn secondary" onClick={() => setStep(2)}>{T.back}</button>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            {ar
              ? "هذا الموقع محمي بواسطة reCAPTCHA وتسري عليه "
              : "This site is protected by reCAPTCHA and the Google "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              {ar ? "سياسة خصوصية Google" : "Privacy Policy"}
            </a>{" "}
            {ar ? "و" : "and"}{" "}
            <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
              {ar ? "شروط الخدمة" : "Terms of Service"}
            </a>
            {ar ? "." : " apply."}
          </p>
          {result && (
            <p className="panel" style={{ marginTop: 14, fontSize: 14, padding: 14 }}>{result}</p>
          )}
        </div>
      )}
    </div>
  );
}
