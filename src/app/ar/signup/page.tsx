"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";

// Sign-up goes through /api/auth/signup (added 2026-11-18, auth hardening):
// server-side rate limit + reCAPTCHA v3 (action "signup") + server-side
// 12-character minimum. Google sign-up uses Supabase OAuth and the
// existing /auth/callback code exchange.

export default function ArSignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Preload reCAPTCHA on mount (M3, 2026-11-19): same missing_token fix as signup.
  useEffect(() => {
    loadRecaptcha();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const recaptchaToken = await getRecaptchaToken("signup");
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, recaptcha_token: recaptchaToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        message?: string;
      };
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل إنشاء الحساب. حاول مجدداً.");
        return;
      }
      setMessage(
        data.message ||
          "تم استلام طلب حسابك. تحقق من بريدك الإلكتروني لتأكيد عنوانك، ثم سجّل الدخول."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل إنشاء الحساب. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  async function signInWithGoogle() {
    setError("");
    setBusy(true);
    try {
      const { error } = await createClient().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) setError(error.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التسجيل عبر Google. حاول مجدداً.");
    } finally {
      setBusy(false);
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
          مسجل بالفعل؟ سجّل الدخول
        </Link>
      </nav>
      <div className="authwrap">
        <section className="panel authcard">
          <div className="eyebrow">انضم إلى المنصة</div>
          <h1>
            أنشئ <span className="gold">حسابك.</span>
          </h1>
          <p className="muted">
            يبدأ حسابك بوصول آمن للعملاء. تُمنح صلاحيات الإدارة بشكل منفصل من
            قبل المنصة.
          </p>
          <form onSubmit={submit}>
            <div className="field">
              <label htmlFor="name">الاسم الكامل</label>
              <input
                id="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="field">
              <label htmlFor="email">البريد الإلكتروني</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="password">كلمة المرور (12 حرفاً على الأقل)</label>
              <input
                id="password"
                type="password"
                minLength={12}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </div>
            {error && <p className="error">{error}</p>}
            {message && <p className="success">{message}</p>}
            <button className="btn" style={{ width: "100%" }} disabled={busy}>
              {busy ? "جارٍ الإنشاء…" : "إنشاء الحساب"}
            </button>
          </form>
          <p className="muted" style={{ textAlign: "center", margin: "18px 0 0" }}>
            أو
          </p>
          <button
            type="button"
            className="btn secondary"
            disabled={busy}
            style={{ width: "100%", marginTop: 12 }}
            onClick={signInWithGoogle}
          >
            إنشاء حساب عبر Google
          </button>
        </section>
      </div>
    </main>
  );
}
