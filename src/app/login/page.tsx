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
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const router = useRouter();

  // Preload reCAPTCHA on mount (M3, 2026-11-19): the script used to
  // load only at submit, so on a slow mobile connection the token never
  // arrived (missing_token) and the server rejected the sign-in 403.
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
        setError(data.error || "Sign-in failed. Please try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed. Please try again.");
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
        setError(data.error || "Verification failed. Please try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Google sign-in (Supabase OAuth): the provider redirects to Google,
  // then back to /auth/callback, which exchanges the code for a session.
  // The Google provider must be enabled in Supabase Auth config.
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
      setError(err instanceof Error ? err.message : "Google sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <nav className="nav">
        <Link href="/" className="brand">
          <span className="brandmark">S</span>SUPRA<span className="brand-sep">/</span>
          <span className="gold">SCIENCE</span>
        </Link>
        <Link href="/" className="muted">← Home</Link>
      </nav>
      <div className="authwrap">
        <section className="panel authcard">
          <div className="eyebrow">Secure client access</div>
          <h1>
            Welcome <span className="gold">back.</span>
          </h1>
          <p className="muted">Sign in to continue to your Supra-Science workspace.</p>
          {mfaFactorId ? (
            <form onSubmit={submitMfa}>
              <div className="field">
                <label htmlFor="mfa-code">Two-factor code</label>
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
              <p className="muted">Enter the 6-digit code from your authenticator app.</p>
              {error && <p className="error">{error}</p>}
              <button className="btn" disabled={busy} style={{ width: "100%" }}>
                {busy ? "Verifying…" : "Verify and sign in"}
              </button>
            </form>
          ) : (
            <>
            <form onSubmit={submit}>
              <div className="field">
                <label htmlFor="email">Email address</label>
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
                <label htmlFor="password">Password</label>
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
                {busy ? "Signing in…" : "Sign in securely"}
              </button>
            </form>
            <p className="muted" style={{ textAlign: "center", margin: "18px 0 0" }}>
              or
            </p>
            <button
              type="button"
              className="btn secondary"
              disabled={busy}
              style={{ width: "100%", marginTop: 12 }}
              onClick={signInWithGoogle}
            >
              Continue with Google
            </button>
            </>
          )}
          <p className="muted" style={{ marginTop: 20 }}>
            <Link className="gold" href="/forgot-password">Forgot password?</Link>
            {" "}· New here?{" "}
            <Link className="gold" href="/signup">Create account</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
