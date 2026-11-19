/**
 * reCAPTCHA helpers (server verify + client token helpers).
 *
 * reCAPTCHA v3, invisible.
 *
 * Server verifier reconstructed in full from the Nov-8 live worker
 * bundle (module 64408) — unchanged.
 *
 * Browser loader re-implemented 2026-11-09 (the bundle only carried an
 * SSR stub for it: loadRecaptcha() was a no-op, getRecaptchaToken()
 * returned null, module 58086). Implementation follows the standard
 * v3 pattern: load
 * https://www.google.com/recaptcha/api.js?render=<site key> once, then
 * grecaptcha.ready() + grecaptcha.execute(siteKey, { action }).
 * Site key comes from NEXT_PUBLIC_RECAPTCHA_SITE_KEY (public var, set
 * in wrangler.jsonc / .env.example; never hardcode the value here).
 * Actions (must match the call sites and what the server expects):
 * "contact" (contact form), "booking" (booking form), "intake"
 * (intake wizard), "public_assistant" (public AI assistant widget).
 *
 * Failure contract: any loader failure (no site key, script blocked,
 * grecaptcha missing, timeout) returns null — never throws — so the
 * form submission still reaches the server, where the verifier
 * enforces the gate (403) on any verification failure, including a
 * missing server secret (fail-closed).
 */

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const SCRIPT_ID = "supra-recaptcha-v3";
const LOAD_TIMEOUT_MS = 10_000;
const EXECUTE_TIMEOUT_MS = 10_000;

let loadPromise: Promise<void> | null = null;
let warnedNoKey = false;

function getSiteKey(): string | null {
  const key = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  return key && key.trim().length > 0 ? key.trim() : null;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${ms}ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Load the reCAPTCHA v3 script (client only). Idempotent: concurrent
 * callers share one <script> tag and one load promise. Safe to call on
 * the server (no-op) and safe to call when the site key is unset
 * (warns once, no-op — getRecaptchaToken() then returns null and the
 * server gate decides).
 */
export function loadRecaptcha(): void {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (loadPromise) return;
  const siteKey = getSiteKey();
  if (!siteKey) {
    if (!warnedNoKey) {
      warnedNoKey = true;
      console.warn(
        "[recaptcha] NEXT_PUBLIC_RECAPTCHA_SITE_KEY is not set — tokens will be null",
      );
    }
    return;
  }
  if (window.grecaptcha) return; // already loaded (e.g. by another copy)
  loadPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      // Tag already present (e.g. injected by an earlier mount): wait
      // for grecaptcha to appear instead of injecting a second tag.
      const start = Date.now();
      const poll = (): void => {
        if (window.grecaptcha) return resolve();
        if (Date.now() - start > LOAD_TIMEOUT_MS) {
          return reject(new Error("grecaptcha did not become available"));
        }
        setTimeout(poll, 100);
      };
      poll();
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null; // allow a later retry
      reject(new Error("failed to load reCAPTCHA script"));
    };
    document.head.appendChild(script);
  });
  // Swallow unhandled rejection: callers observe failure via getRecaptchaToken().
  loadPromise.catch(() => {});
}

/**
 * Execute reCAPTCHA for `action` and return the token, or null on any
 * failure (no site key, script blocked, grecaptcha missing, timeout).
 * Ensures the script is loading even if loadRecaptcha() was never
 * called (e.g. a submit before the mount effect ran).
 */
export async function getRecaptchaToken(action: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const siteKey = getSiteKey();
  if (!siteKey) return null;
  try {
    loadRecaptcha();
    if (loadPromise) {
      await withTimeout(loadPromise, LOAD_TIMEOUT_MS, "reCAPTCHA script load");
    }
    const grecaptcha = window.grecaptcha;
    if (!grecaptcha) return null;
    await withTimeout(
      new Promise<void>((resolve) => grecaptcha.ready(resolve)),
      EXECUTE_TIMEOUT_MS,
      "grecaptcha.ready",
    );
    const token = await withTimeout(
      grecaptcha.execute(siteKey, { action }),
      EXECUTE_TIMEOUT_MS,
      "grecaptcha.execute",
    );
    return typeof token === "string" && token.length > 0 ? token : null;
  } catch (err) {
    console.warn(
      "[recaptcha] token failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return null;
  }
}

export type RecaptchaResult =
  | { verified: true; score: number }
  | { verified: false; reason: "not_configured" | "missing_token" | "low_score" | "failed" | "error" | "action_mismatch" };

/**
 * Server-side verification against Google's siteverify endpoint
 * (reconstructed in full from bundle module 64408).
 *
 * FAIL-CLOSED (fixed 2026-11-13, audit finding #1): every failure
 * reason — including "not_configured" (secret missing) — must make
 * callers reject the request (403). There is no bypass: a deployment
 * without RECAPTCHA_SECRET_KEY must not accept form submissions. The
 * secret is set on the live Worker; a missing secret is a deployment
 * defect, not a reason to bypass the gate.
 *
 * - No RECAPTCHA_SECRET_KEY → { verified: false, reason: "not_configured" }.
 * - No token → { verified: false, reason: "missing_token" }.
 * - v3 score threshold: verified only when success === true and
 *   score >= 0.5; a successful low score is reason "low_score".
 * - Action check: Google returns the action the token was minted for
 *   in `data.action`. It must be one of `expectedAction` — a token
 *   minted for another form (e.g. "contact" reused on the booking
 *   endpoint) is rejected as "action_mismatch". The contact endpoint
 *   accepts both "contact" and "intake" because the intake wizard
 *   posts to /api/contact with action "intake".
 */
export async function verifyRecaptcha(
  token: string | null,
  expectedAction: string | string[],
  remoteIp?: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    console.warn("[recaptcha] RECAPTCHA_SECRET_KEY not set — rejecting (fail-closed)");
    return { verified: false, reason: "not_configured" };
  }
  if (!token) return { verified: false, reason: "missing_token" };
  try {
    const res = await withTimeout(fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret,
        response: token,
        ...(remoteIp && remoteIp !== "unknown" ? { remoteip: remoteIp } : {}),
      }),
    }), 10_000, "reCAPTCHA siteverify");
    if (!res.ok) return { verified: false, reason: "error" };
    const data = await res.json();
    const score = typeof data.score === "number" ? data.score : 0;
    if (data.success !== true) {
      return { verified: false, reason: "failed" };
    }
    const allowed = Array.isArray(expectedAction) ? expectedAction : [expectedAction];
    if (typeof data.action !== "string" || !allowed.includes(data.action)) {
      console.warn(
        `[recaptcha] action mismatch: got ${JSON.stringify(data.action)}, expected ${allowed.join(" or ")}`,
      );
      return { verified: false, reason: "action_mismatch" };
    }
    return score >= 0.5
      ? { verified: true, score }
      : { verified: false, reason: "low_score" };
  } catch (err) {
    console.error(
      "[recaptcha] verify failed:",
      err instanceof Error ? err.message.slice(0, 200) : "unknown",
    );
    return { verified: false, reason: "error" };
  }
}
