"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";

// Reset goes through /api/auth/forgot-password (added 2026-11-19, audit
// finding M1): server-side rate limit + reCAPTCHA v3 (action
// "forgot-password"), then Supabase reset mail. No direct browser call.
export default function ArForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Preload reCAPTCHA on mount (M3): same missing_token fix as login.
  useEffect(() => {
    loadRecaptcha();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      const recaptchaToken = await getRecaptchaToken("forgot-password");
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, recaptcha_token: recaptchaToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "فشلت إعادة التعيين. حاول مرة أخرى.");
        return;
      }
      setMessage(
        "إذا كان هناك حساب مسجل بهذا العنوان، فقد أُرسل رابط إعادة التعيين إليه."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "فشلت إعادة التعيين. حاول مرة أخرى."
      );
    }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <Link href="/ar" className="brand">
          <span className="brandmark">S</span>
          SUPRA<span className="brand-sep">/</span><span className="gold">SCIENCE</span>
        </Link>
        <Link href="/ar/login" className="muted">
          العودة إلى تسجيل الدخول
        </Link>
      </nav>
      <div className="authwrap">
        <section className="panel authcard">
          <div className="eyebrow">استعادة الحساب</div>
          <h1>
            أعد تعيين <span className="gold">كلمة المرور.</span>
          </h1>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
            <button className="btn" style={{ width: "100%" }}>
              إرسال رابط التعيين
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
