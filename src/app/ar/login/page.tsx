"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRecaptchaToken, loadRecaptcha } from "@/lib/recaptcha";
import { createClient } from "@/lib/supabase/client";

// Sign-in goes through /api/auth/login (added 2026-11-13, audit finding #6):
// server-side rate limit + reCAPTCHA v3 (action "login"), then Supabase
// sign-in. Accounts with an enrolled TOTP factor get mfa_required and
// complete verification here before reaching the dashboard.
export default function ArLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const router = useRouter();

  // Preload reCAPTCHA on mount (M3, 2026-11-19): same missing_token fix as /login.
  useEffect(() => {
    loadRecaptcha();
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const recaptchaToken = await getRecaptchaToken("login");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, recaptcha_token: recaptchaToken }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        mfa_required?: boolean;
        factorId?: string;
      };
      if (data.mfa_required && data.factorId) {
        setMfaFactorId(data.factorId);
        return;
      }
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل تسجيل الدخول. حاول مجدداً.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  async function submitMfa(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/mfa-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ factorId: mfaFactorId, code: mfaCode }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setError(data.error || "فشل التحقق. حاول مجدداً.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التحقق. حاول مجدداً.");
    } finally {
      setBusy(false);
    }
  }

  // تسجيل الدخول عبر Google (Supabase OAuth): ينتقل المزود إلى Google،
  // ثم يعود إلى /auth/callback الذي يبدّل الرمز بجلسة.
  // يجب تفعيل مزود Google في إعدادات Supabase Auth.
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
      setError(err instanceof Error ? err.message : "فشل تسجيل الدخول عبر Google. حاول مجدداً.");
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
        <Link href="/ar" className="muted">
          → الرئيسية
        </Link>
      </nav>
      <div className="authwrap">
        <section className="panel authcard">
          <div className="eyebrow">وصول آمن للعملاء</div>
          <h1>
            مرحباً <span className="gold">بعودتك.</span>
          </h1>
          <p className="muted">
            سجّل الدخول للمتابعة إلى مساحة عمل سوبرا-ساينس الخاصة بك.
          </p>
          {mfaFactorId ? (
            <form onSubmit={submitMfa}>
              <div className="field">
                <label htmlFor="mfa-code">رمز التحقق بخطوتين</label>
                <input
                  id="mfa-code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <p className="muted">أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة.</p>
              {error && <p className="error">{error}</p>}
              <button className="btn" disabled={busy} style={{ width: "100%" }}>
                {busy ? "جارٍ التحقق…" : "تحقق وسجّل الدخول"}
              </button>
            </form>
          ) : (
            <>
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="email">البريد الإلكتروني</label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="password">كلمة المرور</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="error">{error}</p>}
              <button className="btn" disabled={busy} style={{ width: "100%" }}>
                {busy ? "جارٍ تسجيل الدخول…" : "تسجيل الدخول"}
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
              المتابعة عبر Google
            </button>
            </>
          )}
          <p className="muted" style={{ marginTop: 20 }}>
            <Link className="gold" href="/ar/forgot-password">
              نسيت كلمة المرور؟
            </Link>{" "}
            · جديد هنا؟{" "}
            <Link className="gold" href="/ar/signup">
              أنشئ حساباً
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
