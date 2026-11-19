"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";

export type SiteLang = "en" | "ar";

// Sunday–Thursday (getUTCDay values) in Aden time (UTC+3).
const WORKING_WEEKDAYS = [0, 1, 2, 3, 4];

const TOPICS: Array<{ slug: string; en: string; ar: string }> = [
  { slug: "general", en: "General consultation", ar: "استشارة عامة" },
  {
    slug: "digital-products",
    en: "Digital products & applications",
    ar: "المنتجات والتطبيقات الرقمية",
  },
  {
    slug: "software-ai",
    en: "Software & AI",
    ar: "البرمجيات والذكاء الاصطناعي",
  },
  {
    slug: "embedded-iot",
    en: "Embedded systems & IoT",
    ar: "الأنظمة المدمجة وإنترنت الأشياء",
  },
  {
    slug: "scientific",
    en: "Scientific & medical prototypes",
    ar: "النماذج العلمية والطبية الأولية",
  },
  {
    slug: "automation",
    en: "Business automation & WhatsApp",
    ar: "أتمتة الأعمال وواتساب",
  },
];

const STRINGS = {
  en: {
    intro:
      "Pick a topic, a day and a time. The meeting is a free 30-minute video call on Google Meet, and a calendar invitation is sent to your email.",
    topic: "Topic",
    day: "Day",
    time: "Time (Aden time, UTC+3)",
    loadingSlots: "Loading available times…",
    noSlots: "No free times left on this day — please pick another day.",
    slotsError:
      "Times could not be loaded. Please try again, or reach us on WhatsApp.",
    name: "Your name",
    namePh: "Full name",
    email: "Email",
    emailPh: "you@example.com",
    phone: "Phone (optional)",
    phonePh: "+1 …",
    submit: "Book my free consultation",
    submitting: "Booking…",
    successTitle: "Your consultation is booked ✓",
    successNote:
      "A calendar invitation was sent to your email. Join with the link below at the booked time.",
    joinMeet: "Join Google Meet",
    copyLink: "Copy link",
    copied: "Copied",
    bookAnother: "Book another consultation",
    recaptchaNote:
      "This form is protected by reCAPTCHA and the Google Privacy Policy and Terms of Service apply.",
    privacyLink: "Privacy Policy",
    termsLink: "Terms of Service",
  },
  ar: {
    intro:
      "اختر الموضوع واليوم والوقت. الاجتماع مكالمة فيديو مجانية لمدة 30 دقيقة عبر Google Meet، وتصلك دعوة تقويم على بريدك.",
    topic: "الموضوع",
    day: "اليوم",
    time: "الوقت (بتوقيت عدن، UTC+3)",
    loadingSlots: "جارٍ تحميل الأوقات المتاحة…",
    noSlots: "لا أوقات متاحة في هذا اليوم — اختر يوماً آخر.",
    slotsError:
      "تعذّر تحميل الأوقات. حاول مجدداً أو تواصل معنا على واتساب.",
    name: "اسمك",
    namePh: "الاسم الكامل",
    email: "البريد الإلكتروني",
    emailPh: "you@example.com",
    phone: "الهاتف (اختياري)",
    phonePh: "+1 …",
    submit: "احجز استشارتي المجانية",
    submitting: "جارٍ الحجز…",
    successTitle: "تم حجز استشارتك ✓",
    successNote:
      "وصلتك دعوة تقويم على بريدك. انضم بالرابط أدناه في الموعد المحجوز.",
    joinMeet: "الانضمام إلى Google Meet",
    copyLink: "نسخ الرابط",
    copied: "تم النسخ",
    bookAnother: "احجز استشارة أخرى",
    recaptchaNote:
      "هذا النموذج محمي بخدمة reCAPTCHA وتسري سياسة خصوصية Google وشروط خدمتها.",
    privacyLink: "سياسة الخصوصية",
    termsLink: "شروط الخدمة",
  },
};

/** "Today" in Aden time (UTC+3), as {y, m, d, weekday}. */
function adenToday(now = new Date()) {
  const aden = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return {
    y: aden.getUTCFullYear(),
    m: aden.getUTCMonth() + 1,
    d: aden.getUTCDate(),
    weekday: aden.getUTCDay(),
  };
}

function formatDay(day: { y: number; m: number; d: number }): string {
  return `${day.y}-${String(day.m).padStart(2, "0")}-${String(day.d).padStart(2, "0")}`;
}

/** Working days (Sun–Thu) for the next 15 days, as YYYY-MM-DD strings. */
function nextWorkingDays(now = new Date()): string[] {
  const today = adenToday(now);
  const days: string[] = [];
  for (let offset = 0; offset <= 14; offset++) {
    const date = new Date(Date.UTC(today.y, today.m - 1, today.d + offset));
    const day = {
      y: date.getUTCFullYear(),
      m: date.getUTCMonth() + 1,
      d: date.getUTCDate(),
      weekday: date.getUTCDay(),
    };
    if (WORKING_WEEKDAYS.includes(day.weekday)) days.push(formatDay(day));
  }
  return days;
}

function formatDayLabel(dateStr: string, lang: SiteLang): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", {
    timeZone: "Asia/Aden",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

function formatSlotTime(iso: string, lang: SiteLang): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", {
    timeZone: "Asia/Aden",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

function formatBookedAt(iso: string, lang: SiteLang): string {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return iso;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", {
    timeZone: "Asia/Aden",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(parsed));
}

/**
 * Free 30-minute consultation booking form.
 * Fetches free slots from /api/bookings/slots and creates the booking via
 * POST /api/bookings. (Reconstructed from the Nov-8 live bundle,
 * module 49517.)
 *
 * Behaviour notes (all from the bundle):
 * - Day list: the next 15 days, Sunday–Thursday only, in Aden time.
 * - On first render the form probes the days in order and pre-selects the
 *   first day that has free slots.
 * - Slots are re-fetched whenever the day changes.
 * - The submitted `topic` is the localised topic label; `service_slug`
 *   carries the topic slug.
 * - reCAPTCHA: token action "booking" (see src/lib/recaptcha.ts).
 */
export function BookingForm({ lang }: { lang: SiteLang }) {
  const t = STRINGS[lang];
  const days = useMemo(() => nextWorkingDays(), []);

  const [topic, setTopic] = useState("general");
  const [day, setDay] = useState(days[0] ?? "");
  const [slots, setSlots] = useState<string[]>([]);
  const [slotsState, setSlotsState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [slot, setSlot] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [meetLink, setMeetLink] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [copied, setCopied] = useState(false);
  // True once the initial probe has run or the visitor picked a day.
  const [daySettled, setDaySettled] = useState(false);

  // Probe days in order; pre-select the first day with free slots.
  useEffect(() => {
    if (daySettled || days.length === 0) return;
    let cancelled = false;
    (async () => {
      for (const candidate of days) {
        if (cancelled) return;
        try {
          const res = await fetch(
            `/api/bookings/slots?date=${encodeURIComponent(candidate)}`,
          );
          const data = await res.json();
          if (data.ok && Array.isArray(data.slots) && data.slots.length > 0) {
            if (!cancelled) setDay(candidate);
            break;
          }
        } catch {
          // Try the next day.
        }
      }
      if (!cancelled) setDaySettled(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [days, daySettled]);

  useEffect(() => {
    loadRecaptcha();
  }, []);

  useEffect(() => {
    if (!day) return;
    let cancelled = false;
    setSlotsState("loading");
    setSlots([]);
    setSlot("");
    fetch(`/api/bookings/slots?date=${encodeURIComponent(day)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.ok && Array.isArray(data.slots)) {
          setSlots(data.slots);
          setSlotsState("done");
        } else {
          setSlotsState("error");
          setError(data.error || t.slotsError);
        }
      })
      .catch(() => {
        if (!cancelled) setSlotsState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [day, t.slotsError]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setStatus("sending");
    setError("");
    const recaptchaToken = await getRecaptchaToken("booking");
    const topicLabel = TOPICS.find((x) => x.slug === topic)?.[lang] ?? topic;
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone: phone || undefined,
        topic: topicLabel,
        service_slug: topic,
        start: slot,
        recaptcha_token: recaptchaToken,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.ok) {
      setMeetLink(data.meetLink ?? null);
      setScheduledAt(data.scheduledAt ?? slot);
      setStatus("done");
    } else {
      setError(data.error || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="panel" style={{ marginTop: 16 }}>
        <h2 style={{ color: "#2e7d32" }}>{t.successTitle}</h2>
        <p className="lead" style={{ fontSize: 15 }}>
          {formatBookedAt(scheduledAt, lang)} · 30{" "}
          {lang === "ar" ? "دقيقة" : "minutes"}
        </p>
        <p>{t.successNote}</p>
        {meetLink ? (
          <div
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}
          >
            <a
              className="btn"
              href={meetLink}
              target="_blank"
              rel="noreferrer"
            >
              {t.joinMeet}
            </a>
            <button
              className="btn secondary"
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(meetLink).catch(() => null);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? t.copied : t.copyLink}
            </button>
          </div>
        ) : null}
        <div style={{ marginTop: 16 }}>
          <button
            className="btn secondary"
            type="button"
            onClick={() => {
              setStatus("idle");
              setMeetLink(null);
              setScheduledAt("");
              setName("");
              setEmail("");
              setPhone("");
              setSlot("");
            }}
          >
            {t.bookAnother}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="panel" style={{ marginTop: 16 }}>
      <p className="lead" style={{ fontSize: 15 }}>
        {t.intro}
      </p>

      <label className="field">
        {t.topic}
        <select value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((x) => (
            <option key={x.slug} value={x.slug}>
              {x[lang]}
            </option>
          ))}
        </select>
      </label>

      <label className="field">
        {t.day}
        <select
          value={day}
          onChange={(e) => {
            setDay(e.target.value);
            setDaySettled(true);
          }}
        >
          {days.map((d) => (
            <option key={d} value={d}>
              {formatDayLabel(d, lang)}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span>{t.time}</span>
        {slotsState === "loading" && <p className="muted">{t.loadingSlots}</p>}
        {slotsState === "error" && (
          <p className="error">{error || t.slotsError}</p>
        )}
        {slotsState === "done" && slots.length === 0 && (
          <p className="muted">{t.noSlots}</p>
        )}
        {slotsState === "done" && slots.length > 0 && (
          <div
            style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}
          >
            {slots.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                aria-pressed={slot === s}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border:
                    slot === s ? "2px solid #06B6D4" : "1px solid #c7d0da",
                  background: slot === s ? "#d9f2fa" : "transparent",
                  color: "#0B132B",
                  cursor: "pointer",
                  fontSize: 14,
                }}
              >
                {formatSlotTime(s, lang)}
              </button>
            ))}
          </div>
        )}
      </div>

      <label className="field">
        {t.name}
        <input
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.namePh}
        />
      </label>

      <label className="field">
        {t.email}
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.emailPh}
        />
      </label>

      <label className="field">
        {t.phone}
        <input
          maxLength={40}
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t.phonePh}
        />
      </label>

      {status === "error" && <p className="error">{error}</p>}

      <button
        className="btn"
        type="submit"
        disabled={status === "sending" || !slot}
      >
        {status === "sending" ? t.submitting : t.submit}
      </button>

      <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
        {t.recaptchaNote}{" "}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
          {t.privacyLink}
        </a>{" "}
        <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
          {t.termsLink}
        </a>
      </p>
    </form>
  );
}
