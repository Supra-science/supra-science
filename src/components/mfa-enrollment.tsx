"use client";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { t, type Lang } from "@/lib/i18n";

/**
 * Two-factor authentication (TOTP) enrollment — added 2026-11-13, audit finding #6.
 * Supabase Auth already allows TOTP enrollment (mfa_totp_enroll_enabled=true);
 * this component is the UI for it, shown on the dashboard next to the
 * password change. Enrollment is opt-in: nothing changes for accounts that
 * never enroll. Once enrolled, sign-in requires the TOTP code (handled in
 * the login pages) and the admin guards require an AAL2 session.
 */
export function MfaEnrollment({ lang }: { lang: Lang }) {
  const [enrolled, setEnrolled] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const refresh = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.mfa.listFactors();
      const verified = (data?.totp ?? []).find((f) => f.status === "verified");
      setEnrolled(!!verified);
      setFactorId(verified?.id ?? null);
    } catch {
      // Leave the previous state; enrollment stays optional.
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function startEnroll() {
    setMsg(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error) throw error;
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : t("updateFailed", lang) });
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    if (!factorId || !/^\d{6}$/.test(code)) {
      setMsg({ ok: false, text: t("mfaCodeLabel", lang) });
      return;
    }
    setMsg(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { data: challenge, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId });
      if (challengeError || !challenge) throw challengeError ?? new Error("challenge failed");
      const { error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code,
      });
      if (error) throw error;
      setQrCode(null);
      setSecret(null);
      setCode("");
      setMsg({ ok: true, text: t("mfaEnrolled", lang) });
      await refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : t("updateFailed", lang) });
    } finally {
      setBusy(false);
    }
  }

  async function removeFactor() {
    if (!factorId) return;
    setMsg(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) throw error;
      setMsg({ ok: true, text: t("mfaRemoved", lang) });
      await refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : t("updateFailed", lang) });
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) return null;

  return (
    <article className="tile" style={{ marginTop: 16 }}>
      <h3>{t("mfaTitle", lang)}</h3>
      <p className="muted" style={{ fontSize: 13 }}>
        {t("mfaBody", lang)}
      </p>
      <p style={{ fontSize: 13 }}>
        {enrolled ? t("mfaEnabled", lang) : t("mfaNotEnabled", lang)}
      </p>
      {enrolled ? (
        <button className="btn secondary" disabled={busy} onClick={removeFactor}>
          {busy ? t("updating", lang) : t("mfaRemove", lang)}
        </button>
      ) : qrCode ? (
        <div>
          <p style={{ fontSize: 13 }}>{t("mfaScanQr", lang)}</p>
          {qrCode.startsWith("data:") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrCode} alt="MFA QR code" width={180} height={180} />
          ) : qrCode.startsWith("<svg") ? (
            <div dangerouslySetInnerHTML={{ __html: qrCode }} />
          ) : null}
          {secret && (
            <p style={{ fontSize: 13 }}>
              {t("mfaSecret", lang)}{" "}
              <code dir="ltr" style={{ userSelect: "all" }}>{secret}</code>
            </p>
          )}
          <label className="field" style={{ marginBottom: 12 }}>
            <span>{t("mfaCodeLabel", lang)}</span>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              dir="ltr"
            />
          </label>
          <button className="btn" disabled={busy} onClick={confirmEnroll}>
            {busy ? t("updating", lang) : t("mfaVerifyAndEnable", lang)}
          </button>
        </div>
      ) : (
        <button className="btn" disabled={busy} onClick={startEnroll}>
          {busy ? t("updating", lang) : t("mfaEnable", lang)}
        </button>
      )}
      {msg && (
        <p style={{ fontSize: 13, color: msg.ok ? "#166534" : "#b3261e" }}>{msg.text}</p>
      )}
    </article>
  );
}
