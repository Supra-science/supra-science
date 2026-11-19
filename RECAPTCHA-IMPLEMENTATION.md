# Supra-Science — reCAPTCHA v3 Browser Loader Implementation

**Date:** 2026-11-09
**Tree:** `/home/hatch/workspace/supra-science-live-reconstruction/`
**Status:** Implemented and tested in dev. **Nothing deployed, nothing pushed,
no live site / Cloudflare / database touched, no messages or emails sent.**
No secret values are printed or copied anywhere in this document (key
*names* only; the dev run used Google's published public test keys — see §5).

## 1. The gap

The Nov-8 live worker bundle contained the server-side reCAPTCHA verifier
in full but only an SSR stub of the browser helpers
(`src/lib/recaptcha.ts`: `loadRecaptcha()` was a no-op,
`getRecaptchaToken()` returned `null`). The browser loader was therefore
unrecoverable from the bundle and was marked `TODO(RECONSTRUCTION-GAP)`.
Until this change, every form submitted a `null` token and the server gate
was skipped whenever `RECAPTCHA_SECRET_KEY` was unset — and would have
403'd every submission once the secret was set.

## 2. What was implemented

One file changed: **`src/lib/recaptcha.ts`** (client helpers only; the
server verifier `verifyRecaptcha` is untouched).

- `loadRecaptcha()` — loads
  `https://www.google.com/recaptcha/api.js?render=<site key>` once.
  Idempotent: concurrent callers (contact form, booking form, intake
  wizard, public-assistant widget all call it on mount/open) share one
  `<script id="supra-recaptcha-v3">` tag and one load promise. Safe to
  call on the server (no-op) and safe when the site key is unset (warns
  once, no-op). A failed load clears the promise so a later call retries.
- `getRecaptchaToken(action)` — ensures the script is loading, waits for
  `grecaptcha.ready()`, then `grecaptcha.execute(siteKey, { action })`
  and returns the token. Any failure (no site key, script blocked,
  `grecaptcha` missing, 10 s timeout on load/ready/execute) returns
  `null` — never throws — so the form still submits and the server gate
  decides (fail-closed: 403 when the secret is configured).
- Site key is read from `process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
  (public var, already declared in `.env.example` and `wrangler.jsonc`).
  The value is never hardcoded anywhere in the tree.
- The `TODO(RECONSTRUCTION-GAP)` markers in this file are removed; the
  header comment now documents the implementation.

### Action names per form (unchanged — taken from the existing call sites)

| Form | Component | Action | API route |
|---|---|---|---|
| Contact form | `src/components/contact-form.tsx` | `contact` | `POST /api/contact` |
| Booking form | `src/components/booking-form.tsx` | `booking` | `POST /api/bookings` |
| Intake wizard | `src/components/intake-wizard.tsx` | `intake` | `POST /api/contact` (subject "Project intake") |
| Public AI assistant | `src/components/site-chrome.tsx` | `public_assistant` | `POST /api/ai/public-assistant` |

No form component was changed: all four already called `loadRecaptcha()`
on mount/open and `getRecaptchaToken(<action>)` at submit time, and all
four already attach the token as `recaptcha_token` in the request body.

### Server verification (unchanged)

`verifyRecaptcha(token, ip)` POSTs to Google `siteverify`; verified only
when `success === true` and score ≥ 0.5. The three routes 403 with
"Human verification failed…" unless the reason is `not_configured`
(secret unset → gate skipped). Booking checks the slot first (409 for an
invalid slot) and only then verifies the token — that ordering is the
recovered live behaviour, not a change made here.

## 3. How it was tested

Environment: Node v24.22.1, npm 10.9.4, Linux VM. Dev-only; the build used
a build-only `.env.local` (deleted afterwards, as before).

### 3.1 Loader-logic harness (Node, DOM stub, no browser, no network)

The loader was compiled with the project's TypeScript and exercised with
a minimal `window`/`document` stub (`/tmp`, deleted after the run).
3/3 pass:

- injects `https://www.google.com/recaptcha/api.js?render=<site key>`
  exactly once (two `loadRecaptcha()` calls, one `<script>` tag) and
  `getRecaptchaToken("contact")` returns the stub token; a second
  `getRecaptchaToken("booking")` reuses the same tag;
- script load failure → `getRecaptchaToken("intake")` returns `null`,
  does not throw;
- missing site key → `null`, no script injected.

### 3.2 Existing test suite

`npm test`: **106/106 pass, 0 fail** (unchanged).

### 3.3 Production build

`npm run build`: **exit 0, 38/38 pages generated** (first attempt, no
fixes needed for this change).

### 3.4 Loader present in the shipped client bundle

The built client chunk `.next/static/chunks/2u2v1s7fjw7v1.js` contains
the loader (`recaptcha/api.js?render=…`, `async`, `defer`, `onload`,
`onerror`), and the rendered `/ar/contact` HTML references that chunk.
`GET https://www.google.com/recaptcha/api.js?render=<test key>` returns
**200** (endpoint reachable).

### 3.5 Server-gate tests against the live Google verifier

The built app was started locally with Google's published public test
keys (test site key in `.env.local` for the build, test secret as
`RECAPTCHA_SECRET_KEY` in the server environment only — both are
Google's documented test credentials, not real secrets). Results:

| Request | Result |
|---|---|
| `POST /api/contact`, valid fields, bogus token | **403** "Human verification failed…" |
| `POST /api/contact`, valid fields, no token | **403** "Human verification failed…" |
| `POST /api/contact`, intake subject, bogus token | **403** "Human verification failed…" |
| `POST /api/bookings`, valid slot (Tue 2026-11-10 10:00 Aden), bogus token | **403** "Human verification failed…" |
| `POST /api/ai/public-assistant`, bogus token | **403** "Human verification failed…" |
| `POST /api/bookings`, invalid slot, bogus token | 409 "That time is no longer available" (slot check runs before the token check, as in the live flow) |
| `POST /api/bookings/slots?date=2026-11-22` (dev, calendar unconfigured) | 503 "Calendar booking is not configured yet" (pre-existing dev limitation, unrelated to reCAPTCHA) |

Gate-skipped branch also verified: with the server restarted *without*
`RECAPTCHA_SECRET_KEY`, the same bogus-token contact POST was **not**
403 — it passed the gate and failed later at Supabase
(503 "Supabase service credentials not set"), proving the
`not_configured` path still works.

Form pages load: `/ar/contact`, `/ar/book`, `/ar/start` all **200** on
the local server. Both test servers were stopped afterwards and their
ports verified closed.

## 4. What remains unverified

- **No real browser run.** There is no headless browser in this VM, so
  the script was not observed loading inside a real browser and no real
  `grecaptcha.execute()` token was produced. The loader logic is covered
  by the stub harness (§3.1), the shipped bundle contains the loader
  (§3.4), and the server gate is proven against Google's live verifier
  (§3.5) — but a real token from a real browser with the real site key
  has not been verified end to end. Before deploying, load a form page
  in a real browser with the real `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` set
  and confirm a submission succeeds (200) instead of 403.
- No E2E flow test beyond the gate (booking/contact delivery, login,
  assistant) — still needs real credentials and a dev database.

## 5. Notes for deployment

- Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` to the real site key (public var,
  already declared in `wrangler.jsonc` with an empty placeholder) and
  `RECAPTCHA_SECRET_KEY` via `wrangler secret put`. Do **not** use the
  Google test keys in production.
- The Google test keys used in this dev run are the ones Google
  publishes for development testing; their values are not recorded in
  this document or in the tree.
- Reproducible build: `npm ci && npm run build` (public env vars from
  `.env.example`). `.env.local` and `.next/` were deleted after
  verification, so the tree stays source-only; `node_modules/` is kept.
