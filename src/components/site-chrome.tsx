"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { STRINGS } from "@/lib/i18n";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";

export type SiteLang = "en" | "ar";

const NAV_EN: Array<{ href: string; label: string }> = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/services#catalog", label: "WhatsApp Catalog" },
  { href: "/process", label: "How we work" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

const NAV_AR: Array<{ href: string; label: string }> = [
  { href: "/ar", label: "الرئيسية" },
  { href: "/ar/services", label: "الخدمات" },
  { href: "/ar/services#catalog", label: "كتالوج واتساب" },
  { href: "/ar/process", label: "منهجية العمل" },
  { href: "/ar/about", label: "من نحن" },
  { href: "/ar/faq", label: "الأسئلة الشائعة" },
  { href: "/ar/contact", label: "تواصل معنا" },
];

/**
 * Floating public AI assistant widget (rendered inside SiteFooter).
 *
 * Recovered from the live Nov-8 deployment bundle (site-chrome chunk
 * `src_0l490ugf0c62o._.js`). Anonymous chat against
 * /api/ai/public-assistant: sends the last 6 messages as history, a
 * reCAPTCHA token (action "public_assistant"), 60 s abort timeout.
 * Strings come from the i18n dictionary (pa* keys). The component's
 * original export name is unrecoverable (minified); behaviour and
 * strings are verbatim.
 */
function PublicAssistant({ lang }: { lang: SiteLang }) {
  const t = STRINGS;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([{ role: "assistant", content: t.paGreeting[lang] }]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  function toggle() {
    setOpen((v) => !v);
    setError(null);
  }

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    if (text.length > 2000) {
      setError(`${t.messageTooLong[lang]}`);
      return;
    }
    setError(null);
    setSending(true);
    const userMsg = { role: "user" as const, content: text };
    const history = messages.slice(-6);
    setMessages((m) => [...m, userMsg]);
    setInput("");
    try {
      const token = await getRecaptchaToken("public_assistant");
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60_000);
      let res: Response;
      try {
        res = await fetch("/api/ai/public-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            history,
            lang,
            recaptcha_token: token,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timer);
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          res.status === 429
            ? `${t.paTooMany[lang]}`
            : typeof data?.error === "string"
              ? data.error
              : `${t.requestFailed[lang]} (${res.status}).`;
        throw new Error(msg);
      }
      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply ?? "" },
      ]);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError(`${t.requestTimedOut[lang]}`);
      } else {
        setError(err instanceof Error ? err.message : t.somethingWrong[lang]);
      }
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    if (open && !loadedRef.current) {
      loadedRef.current = true;
      loadRecaptcha();
    }
  }, [open]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, sending]);

  return (
    <div
      className="pa-root"
      style={lang === "ar" ? { left: 18 } : { right: 18 }}
    >
      {open && (
        <div className="pa-panel" role="dialog" aria-label={t.paTitle[lang]}>
          <div className="pa-head">
            <span className="pa-head-title">{t.paTitle[lang]}</span>
            <button
              type="button"
              className="pa-close"
              onClick={toggle}
              aria-label={t.paClose[lang]}
            >
              ✕
            </button>
          </div>
          <div className="pa-messages" ref={listRef}>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`pa-msg ${m.role === "user" ? "pa-user" : "pa-ai"}`}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="pa-msg pa-ai pa-thinking">
                {t.thinking[lang]}
              </div>
            )}
          </div>
          {error && (
            <div className="pa-error" role="alert">
              {error}
              <button type="button" onClick={() => setError(null)}>
                {t.dismiss[lang]}
              </button>
            </div>
          )}
          <div className="pa-input-row">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
              placeholder={t.paPlaceholder[lang]}
              aria-label={t.paPlaceholder[lang]}
              maxLength={2000}
              disabled={sending}
            />
            <button
              type="button"
              className="btn pa-send"
              onClick={send}
              disabled={sending || !input.trim()}
            >
              {t.send[lang]}
            </button>
          </div>
          <div className="pa-note">{t.paNote[lang]}</div>
          <div className="pa-note">{t.paPrivacy[lang]}</div>
          <div className="pa-note">
            {lang === "ar"
              ? "هذا الموقع محمي بواسطة reCAPTCHA وتسري عليه "
              : "This site is protected by reCAPTCHA and the Google "}
            <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
              {lang === "ar" ? "سياسة خصوصية Google" : "Privacy Policy"}
            </a>{" "}
            {lang === "ar" ? "و" : "and"}{" "}
            <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
              {lang === "ar" ? "شروط الخدمة" : "Terms of Service"}
            </a>
            .
          </div>
        </div>
      )}
      <button
        type="button"
        className="pa-fab"
        onClick={toggle}
        aria-label={open ? t.paClose[lang] : t.paOpen[lang]}
        aria-expanded={open}
      >
        {open ? (
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M5 5l14 14M19 5L5 19" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l2.2 7.8L22 12l-7.8 2.2L12 22l-2.2-7.8L2 12l7.8-2.2L12 2z" />
          </svg>
        )}
      </button>
    </div>
  );
}

export function SiteNav({ lang }: { lang: SiteLang }) {
  const [open, setOpen] = useState(false);
  const ar = lang === "ar";
  const items = ar ? NAV_AR : NAV_EN;
  const links = items.slice(1);
  const close = () => setOpen(false);

  return (
    <nav className="nav">
      <Link href={ar ? "/ar" : "/"} className="brand" onClick={close}>
        <span className="brandmark">S</span>
        <span>
          SUPRA<span className="brand-sep">/</span><span className="gold">SCIENCE</span>
        </span>
      </Link>

      <div className="nav-links">
        {links.map((l) => (
          <Link key={l.href} className="muted nav-link" href={l.href}>
            {l.label}
          </Link>
        ))}
        {/* Language switcher goes through /api/lang (sets the ss-lang
            cookie) instead of linking directly to / or /ar. */}
        <a
          className="muted nav-link"
          lang={ar ? "en" : "ar"}
          href={ar ? "/api/lang?to=en&next=/" : "/api/lang?to=ar&next=/ar"}
        >
          {ar ? "English" : "العربية"}
        </a>
        <Link className="btn" href={ar ? "/ar/login" : "/login"}>
          {ar ? "بوابة العملاء" : "Client portal"} ↗
        </Link>
      </div>

      <button
        className="menu-btn"
        aria-expanded={open}
        aria-label={ar ? "فتح القائمة" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      {open && (
        <div className="mobile-menu" role="menu">
          {items.map((l) => (
            <Link key={l.href} href={l.href} onClick={close} role="menuitem">
              {l.label}
            </Link>
          ))}
          <a
            href={ar ? "/api/lang?to=en&next=/" : "/api/lang?to=ar&next=/ar"}
            lang={ar ? "en" : "ar"}
            onClick={close}
            role="menuitem"
            className="gold"
          >
            {ar ? "English" : "العربية"}
          </a>
          <Link className="btn" href={ar ? "/ar/login" : "/login"} onClick={close} role="menuitem">
            {ar ? "بوابة العملاء" : "Client portal"} ↗
          </Link>
        </div>
      )}
    </nav>
  );
}

export function SiteFooter({ lang }: { lang: SiteLang }) {
  const ar = lang === "ar";
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto 14px",
          display: "flex",
          gap: 18,
          justifyContent: "center",
          flexWrap: "wrap",
          fontSize: 13,
        }}
      >
        <Link className="muted" href={ar ? "/ar/services" : "/services"}>
          {ar ? "الخدمات" : "Services"}
        </Link>
        <Link className="muted" href={ar ? "/ar/process" : "/process"}>
          {ar ? "منهجية العمل" : "How we work"}
        </Link>
        <Link className="muted" href={ar ? "/ar/about" : "/about"}>
          {ar ? "من نحن" : "About"}
        </Link>
        <Link className="muted" href={ar ? "/ar/faq" : "/faq"}>
          {ar ? "الأسئلة الشائعة" : "FAQ"}
        </Link>
        <Link className="muted" href={ar ? "/ar/contact" : "/contact"}>
          {ar ? "تواصل معنا" : "Contact"}
        </Link>
        <Link className="muted" href={ar ? "/ar/privacy" : "/privacy"}>
          {ar ? "سياسة الخصوصية" : "Privacy"}
        </Link>
        <Link className="muted" href={ar ? "/ar/terms" : "/terms"}>
          {ar ? "الشروط والأحكام" : "Terms"}
        </Link>
        <Link className="muted" href={ar ? "/ar/refund" : "/refund"}>
          {ar ? "سياسة الاسترداد" : "Refund"}
        </Link>
      </div>
      <div
        style={{
          maxWidth: 1180,
          margin: "0 auto 14px",
          display: "flex",
          gap: 18,
          justifyContent: "center",
          flexWrap: "wrap",
          fontSize: 13,
        }}
      >
        <a className="muted" href="https://www.facebook.com/Suprascience" target="_blank" rel="noreferrer">
          Facebook
        </a>
        <a className="muted" href="https://www.linkedin.com/company/supra-science/" target="_blank" rel="noreferrer">
          LinkedIn
        </a>
        <a className="muted" href="https://x.com/supra_science" target="_blank" rel="noreferrer">
          X
        </a>
        <a className="muted" href="https://www.youtube.com/@supra.science" target="_blank" rel="noreferrer">
          YouTube
        </a>
        <a className="muted" href="https://t.me/suprascience1" target="_blank" rel="noreferrer">
          Telegram
        </a>
      </div>
      <div>
        © {year} Supra-Science · {ar ? "المدير: د. فيصل الرداعي" : "Director: Dr. Faisal Alradaei"} ·{" "}
        <a className="gold" href="mailto:Supra-science@proton.me" style={{ whiteSpace: "nowrap" }}>
          Supra-science@proton.me
        </a>{" "}
        ·{" "}
        <a className="gold" href="https://wa.me/19178183426">
          WhatsApp
        </a>
      </div>
      <PublicAssistant lang={lang} />
    </footer>
  );
}
