"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { t, type Lang } from "@/lib/i18n";

/** Change password while signed in — Supabase Auth native, no extra cost. */
export function PasswordChange({ lang }: { lang: Lang }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    if (pw.length < 12) {
      setMsg({ ok: false, text: t("passwordTooShort", lang) });
      return;
    }
    if (pw !== pw2) {
      setMsg({ ok: false, text: t("passwordsMismatch", lang) });
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      setPw("");
      setPw2("");
      setMsg({ ok: true, text: t("passwordUpdated", lang) });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : t("updateFailed", lang) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="tile" style={{ marginTop: 16 }}>
      <h3>{t("changePassword", lang)}</h3>
      <p className="muted" style={{ fontSize: 13 }}>
        {t("changePasswordBody", lang)}
      </p>
      <label className="field" style={{ marginBottom: 10 }}>
        <span>{t("newPassword", lang)}</span>
        <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" dir="ltr" />
      </label>
      <label className="field" style={{ marginBottom: 12 }}>
        <span>{t("confirmPassword", lang)}</span>
        <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" dir="ltr" />
      </label>
      {msg && (
        <p style={{ fontSize: 13, color: msg.ok ? "#166534" : "#b3261e" }}>{msg.text}</p>
      )}
      <button className="btn secondary" disabled={busy} onClick={submit}>
        {busy ? t("updating", lang) : t("updatePassword", lang)}
      </button>
    </article>
  );
}
