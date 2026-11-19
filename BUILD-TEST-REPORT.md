# Supra-Science — Build & Test Report (reconstructed Nov-8 tree)

**Date:** 2026-11-09
**Tree:** `/home/hatch/workspace/supra-science-live-reconstruction/`
**Environment:** Node v24.22.1, npm 10.9.4, Linux VM. Dev-only work: nothing
deployed, nothing pushed, no live site / Cloudflare / database touched, no
messages or emails sent, no secret values printed or copied (public key
*names* only).

## 1. Wording fixes (step 1 of the assignment)

Both are wording-only, no logic change.

| # | Fix | File | Change |
|---|-----|------|--------|
| 1 | Arabic typo "الايريد" → "البريد" | `src/lib/ai-engine.ts:189` (`CONTACT_AR`) | `أو الايريد Supra-science@proton.me` → `أو البريد Supra-science@proton.me` |
| 2 | Stale `messagesLead` wording (SMTP → Gmail API) | `src/lib/i18n.ts:140` | EN: "…when SMTP is configured." → "…via the Gmail API." AR: "…عند ضبط SMTP." → "…عبر Gmail API." The header NOTE in the same file (lines 15–17) was updated to record the fix. |

Verified after the edits: `grep -rn "الايريد" src/ tests/` returns nothing;
the only remaining "SMTP is configured" is the explanatory comment in
`src/lib/i18n.ts` documenting what the live bundle said.

## 2. Install (step 2)

Command:

```
cd /home/hatch/workspace/supra-science-live-reconstruction
npm ci --no-audit --no-fund
```

Result: **success, exit 0 — 634 packages added in ~2 min.** Only deprecation
warnings (node-domexception, eslint 9.39, glob 10). The lockfile matched, so
`npm ci` was used (no `npm install` fallback needed). `node_modules/` is kept
in the tree for future builds; it is gitignored.

## 3. Test suite (step 3)

Command: `npm test` (`node --test "tests/*.mjs"`)

Result: **106 / 106 pass, 0 fail, 15 suites, ~3 s** — run twice (once before
the build fixes, once after), same result both times.

## 4. Production build (step 4)

Command: `npm run build` (`next build`, Next.js 16.4.4 / Turbopack).
The build reads public env vars from `.env.local` (copied from
`.env.example` for the build only, then deleted — it contained only the
public `NEXT_PUBLIC_*` values and empty secret placeholders).

### Attempt 1 — FAILED (Turbopack module error)

```
Build error occurred
Error: Turbopack build failed with 1 error:
./src/app/api/admin/bookings/route.ts:18:1
Error: Export cancelCalendarEvent doesn't exist in target module
  > 18 | import { cancelCalendarEvent } from "@/lib/calendar";
The export cancelCalendarEvent was not found in module [project]/src/lib/calendar.ts
```

Cause: a reconstruction mistake — the route imports `cancelCalendarEvent`
(a name guessed from the minified export `"s"`), but `src/lib/calendar.ts`
only exported `deleteEvent` plus the aliases `listCalendarEvents`,
`createCalendarEvent`, `deleteCalendarEvent`.

Fix (same file, following the existing alias pattern):
`src/lib/calendar.ts` gained `export const cancelCalendarEvent = deleteEvent;`
with a comment explaining it. No behaviour change: `deleteEvent` already
DELETEs the calendar event, returns false (never throws) on failure, and
treats 404 as success — exactly what the route expects.

### Attempt 2 — FAILED (TypeScript type-check, 6 errors in 3 files)

Compilation succeeded (28.2 s) but `next build`'s type check failed:

```
src/app/api/ai/public-assistant/route.ts(159,39): error TS2345: Argument of type
  '{ role: string; content: string; }[]' is not assignable to parameter of type 'ChatMessage[]'.
  Type 'string' is not assignable to type '"user" | "assistant" | "system"'.
src/app/api/ai/public-assistant/route.ts(170,38): error TS2345: (same)
src/lib/ai-engine.ts(55,17): error TS7053: Element implicitly has an 'any' type because
  expression of type 'symbol' can't be used to index type '{}'.
src/lib/ai-engine.ts(57,9): error TS1170: A computed property name in a type literal must
  refer to an expression whose type is a literal type or a 'unique symbol' type.
src/lib/stripe/checkout.ts(28,20): error TS2307: Cannot find module 'stripe' or its
  corresponding type declarations.
src/lib/stripe/payment-links.ts(21,20): error TS2307: Cannot find module 'stripe' or its
  corresponding type declarations.
Failed to type check.
```

Fixes (all type-level or dead-code removal, no logic or business change):

1. `src/app/api/ai/public-assistant/route.ts` — the `messages` array was
   annotated `Array<{ role: string; content: string }>` (role widened to
   `string`). Changed to the engine's type: imported
   `type ChatMessage as EngineChatMessage` from `@/lib/ai-engine` and
   annotated `const messages: EngineChatMessage[]`. The route's own narrower
   local `ChatMessage` type (user|assistant, used by `sanitizeHistory`) was
   left untouched. This mirrors what the authenticated assistant route
   already does (`const messages: ChatMessage[]`).
2. `src/lib/ai-engine.ts` `getWorkersAI()` — replaced the computed-property
   type literal `[Symbol.for("__cloudflare-context__")]` (illegal: `Symbol.for`
   returns `symbol`, not a `unique symbol`) with a `Record<symbol, ...>` cast
   on `globalThis`. Behaviour unchanged.
3. `src/lib/stripe/checkout.ts` and `src/lib/stripe/payment-links.ts` —
   **deleted** (and the now-empty `src/lib/stripe/` directory removed).
   Reason: the `stripe` package was removed from `package.json` in the
   reconstruction (owner's decision; 0 occurrences of "stripe" in the live
   bundle), so these two files could never type-check. Verified by grep that
   **nothing in `src/` or `tests/` imports them** — they were unreferenced
   dead code, and the only remaining "stripe" reference is a comment in
   `tests/platform.test.mjs:61`. This resolves reconstruction decision §7.7
   for these files; copies remain in the Nov-5 package if ever needed.
   No Stripe functionality was wired up or restored anywhere.

### Attempt 3 — SUCCESS

```
✓ Compiled successfully in 28.2s (attempt 2) / 3rd run: compiled, type-checked
✓ Generating static pages using 3 workers (38/38)
BUILD_EXIT: 0
```

Route table (from the build output): `/`, `/ar`, `/about`, `/ar/about`,
`/services`, `/ar/services`, `/process`, `/ar/process`, `/faq`, `/ar/faq`,
`/contact`, `/ar/contact`, `/book`, `/ar/book`, `/start`, `/ar/start`,
`/login`, `/ar/login`, `/signup`, `/ar/signup`, `/forgot-password`,
`/ar/forgot-password`, `/reset-password`, `/privacy`, `/ar/privacy`,
`/terms`, `/ar/terms`, `/dashboard` (+ assistant/architecture/projects/[id]/
quotations), `/admin` (+ 12 sub-pages), `/api/*` (admin ×12, ai ×3,
bookings ×2, contact, lang, whatsapp/webhook), `/auth/callback`,
`/robots.txt` (static), `/sitemap.xml` (static), `/_not-found`. All
dynamic (`ƒ`) except robots/sitemap (static `○`), plus the middleware proxy.

Note: `src/` now has **119 files** (was 121 — the two deleted Stripe lib
files). Manifest coverage vs the live bundle is unchanged for the remaining
files.

## 5. Smoke test (step 5)

Started the production build locally: `npx next start -p 3100`
(ready in 310 ms), curled the routes, then stopped the server (PID killed,
port 3100 verified closed afterwards). No errors in the server log.

| Route | Status | Check |
|---|---|---|
| `/` (no cookie) | 307 | `Location: /ar` |
| `/ar` | 200 | Arabic content renders |
| `/services` (no cookie) | 307 | `Location: /ar/services` |
| `/ar/services` | 200 | Contains price `3,500` |
| `/book` (no cookie) | 307 | `Location: /ar/book` |
| `/ar/book` | 200 | Contains `استشارة` (consultation) |
| `/contact` (no cookie) | 307 | `Location: /ar/contact` |
| `/ar/contact` | 200 | Contact content renders |
| `/login` (no cookie) | 307 | `Location: /ar/login` |
| `/ar/login` | 200 | Contains `تسجيل الدخول` |
| `/faq` (no cookie) | 307 | `Location: /ar/faq` |
| `/ar/faq` | 200 | Contains `الأسئلة الشائعة` |
| `/` with `ss-lang=en` cookie | 200 | English content (`Supra-Science`) renders |
| `/services/software-ai.jpg` | 200 | 142,655 bytes |
| `/leadership/dr-faisal-alradaei.webp` | 200 | 27,012 bytes |
| `/dashboard` (no session) | 307 | Redirects to `/login` |
| `/admin` (no session) | 307 | Redirects to `/login` |

The redirect behaviour matches the live site exactly (verified live earlier:
`/` → 307 `/ar`, `/services` → 307 `/ar/services`, `/book` → 307 `/ar/book`).

## 6. What was NOT tested

- **No end-to-end flow test** (booking, contact submit, login, admin actions,
  AI assistant, WhatsApp webhook). Those need real credentials (Google
  Calendar/Gmail OAuth, Supabase service role, reCAPTCHA) and a dev
  database — none were used here, by design. The routes exist and compile;
  their runtime behaviour against live services is unverified.
- **No OpenNext / Wrangler build** (`@opennextjs/cloudflare` adapter) — only
  the plain `next build`. The Cloudflare Worker packaging is untested.
- **No lint run** (`npm run lint` was not executed).

## 7. Remaining blockers (before any deploy)

1. **reCAPTCHA browser loader — IMPLEMENTED 2026-11-09** (was a stub).
   `src/lib/recaptcha.ts` now loads
   `https://www.google.com/recaptcha/api.js?render=<site key>` once and
   executes `grecaptcha` per form (`contact` / `booking` / `intake` /
   `public_assistant`). Verified: loader-logic harness 3/3, `npm test`
   106/106, `npm run build` exit 0 (38/38 pages), loader present in the
   shipped client chunk, and the server gate proven against Google's live
   verifier with Google's public test keys (bogus/missing token → 403 on
   contact, bookings, intake and public-assistant; gate-skipped branch
   verified with the secret unset). See RECAPTCHA-IMPLEMENTATION.md.
   **Still unverified: no real browser run** — no real
   `grecaptcha.execute()` token has been produced (no headless browser in
   this VM). Before deploying, load a form in a real browser with the
   real site key and confirm a submission succeeds instead of 403.
2. **No E2E flow verification** (see §6) — booking (Calendar + Gmail),
   contact delivery, login/admin, and the assistant must be exercised in
   dev before any deploy.
3. **Owner decisions still open** (from RECONSTRUCTION-REPORT.md §7):
   starter prices ($3,500 / $4,500 / $3,500 / $6,500 / $1,500) approval
   and the "no fixed prices" wording tension; the assistant-history bug
   (AI replies may not be saved to `ai_messages`); deployment approval;
   Supabase migrations (not applied, no DDL without explicit approval).
   Resolved by this session: the AR typo and the stale SMTP wording
   (fixed, §1), and the Stripe dead lib files (deleted, §4). Resolved
   after this report: the reCAPTCHA browser loader (implemented and
   tested 2026-11-09 — see RECAPTCHA-IMPLEMENTATION.md; a real-browser
   token check is still outstanding).
4. `/favicon.ico` is 404 on the live site and was not restored.
5. Remaining `TODO(RECONSTRUCTION-GAP)` markers (12 occurrences): guessed
   admin module filenames, guessed export names, and the unreconstructed
   `ServiceList`/`InvoiceManager` components (unchanged Nov-5 files
   imported as-is). None blocks the build.

## 8. Cleanup

- Production server on port 3100 stopped; port verified closed.
- `.env.local` (build-only copy of `.env.example`) deleted.
- `.next/` build output and `tests/.build/` removed after verification, so
  the tree stays source-only. The build is reproducible with
  `npm ci && npm run build` (public env vars from `.env.example`).
- `node_modules/` kept (634 packages) for future builds.
- Temp files (`/tmp/next-start.log`, `/tmp/smoke-body.html`,
  `/tmp/smoke-en.html`) removed.

## 9. Catalog + samples, AI-history fix, OpenNext packaging (2026-11-09)

Owner approved proceeding with the reconstruction. Work done in this
session (dev-only; nothing deployed, pushed, or changed on live systems
or any database):

### 9.1 WhatsApp Business catalog section + illustrative samples

- New data module `src/lib/whatsapp-catalog.ts` (CATALOG SS-01..SS-05,
  SAMPLES, CAT_STEPS, CATALOG_STRINGS, EN + AR) — content ported verbatim
  from the catalog approved by the owner in the Muse space, except one
  wording update: the space said the items were "ready to be added to
  the official catalog later — not yet added"; the catalog setup in
  WhatsApp Manager was completed on 2026-11-09 (5 items live in
  "Supra-Science Services", linked to +1 (917) 818-3426), so the lead and
  the bottom note now say the cards mirror the official catalog items.
  Recorded in the data file header so the owner can revert it.
- New server component `src/components/whatsapp-catalog.tsx`:
  section `#catalog` (eyebrow, heading, lead), "how to request" panel
  with the two buttons (Open the catalog in WhatsApp →
  `https://wa.me/c/19178183426`; Start a WhatsApp chat →
  `https://wa.me/19178183426`), the 4 ordering steps, 5 catalog cards
  (code, tag, title from the service catalog, short description,
  "Typically includes" list, "Price: Quoted after a scope review" —
  no invented prices), per-card "Request on WhatsApp" wa.me deep link
  with a pre-filled message and a "Full details" anchor to the service
  block, then the samples: general notice, 5 sample cards each with the
  "Hypothetical illustrative sample" badge, idea / typical scope /
  typical deliverables, and the per-sample disclaimer. The SS-04 sample
  states the prototypes are not certified medical devices. No client
  names, no prices, no results anywhere.
- Wired into `src/app/services/page.tsx` and
  `src/app/ar/services/page.tsx` (after the service list, before
  `<FreeOffers />`) and into the nav (`site-chrome.tsx` NAV_EN/NAV_AR:
  "WhatsApp Catalog" → `/services#catalog`, "كتالوج واتساب" →
  `/ar/services#catalog`).

### 9.2 AI assistant history bug — FIXED

`src/app/api/ai/assistant/route.ts`: the `ai_messages` insert sat
inside the `if (reply === null)` fallback branch, so AI-generated
replies were returned but never saved to history. The fix is minimal:
the same insert (same rows, same error handling) now runs after the
reply is resolved, for every engine. This resolves
RECONSTRUCTION-REPORT.md §7.2. The fallback behaviour is unchanged.

### 9.3 Tests — 119/119 pass (was 106/106)

New `tests/whatsapp-catalog.test.mjs` (13 tests): five items with codes
SS-01..SS-05 in order (AR then EN), ten samples (5 per language), no
price figures in the catalog data, SS-04 medical-device disclaimer in
both languages, hypothetical labelling on every sample, four ordering
steps, catalog/chat links, per-item prefilled links, badge + notice +
disclaimer in the component, `#catalog` anchor, details anchors, and
the wiring into both Services pages + both navs. Full suite:
`npm test` — **119 pass, 0 fail, 18 suites**.

### 9.4 Production build + smoke test (after the changes)

`npm run build` — **exit 0, 38/38 pages** (first attempt, no fixes
needed for this session's changes). Smoke test on local port 3101
(server started, curled, stopped by PID, port verified closed):
`/` → 307 `/ar`, `/services` → 307 `/ar/services`, `/book` → 307
`/ar/book`; `/ar`, `/ar/services`, `/ar/book`, `/ar/contact`, `/login`
all 200. Catalog verified in the rendered HTML (EN + AR): all five
codes SS-01..SS-05, `wa.me/c/19178183426`, the "Hypothetical
illustrative sample" badge, "Quoted after a scope review" /
"يُحدَّد بعرض سعر بعد دراسة النطاق", the SS-04 "not a certified
medical device" / "ليس جهازاً طبياً معتمداً" disclaimer, the "How to
order" / "خطوات الطلب" steps, "Full details" / "التفاصيل الكاملة"
anchors, and 5+ correctly encoded per-item wa.me prefilled links
(`...?text=Inquiry about an item prepared for the WhatsApp Business
catalog — Supra-Science / Prepared catalog item: SS-01 — Digital
products & applications`, etc.). The nav link `/services#catalog`
renders on the EN home page.

### 9.5 OpenNext / Cloudflare packaging — VERIFIED, no deploy

`npx opennextjs-cloudflare build` — **exit 0**. Output: `.open-next/`
(37 MB) with `.open-next/worker.js` (entry) and the server-function
bundle; the catalog strings (`wa.me/c/19178183426`, `SS-01`,
"Hypothetical illustrative sample") are present in the packaged server
chunks. **No `wrangler deploy` was run, nothing was uploaded.**
`.open-next/`, `.next/` and the build-only `.env.local` were deleted
afterwards; the tree stays source-only (`src/` now 121 files).

### 9.6 Still outstanding (see DEPLOY-PLAN.md)

- No real-browser reCAPTCHA token check yet (loader harness-tested,
  server gate proven with test keys, but no real `grecaptcha.execute()`
  token produced).
- No E2E flow test (booking/contact/login/admin/assistant against
  real services + a dev database).
- Owner decisions still open: starter-price approval and the "no fixed
  prices" wording tension; Supabase migrations not applied (no DDL
  without explicit approval); deployment approval itself.
- **Deploy hazard found:** `wrangler.jsonc` carries
  `"NEXT_PUBLIC_RECAPTCHA_SITE_KEY": ""` (empty placeholder). Deploying
  as-is would overwrite the live Worker's configured site key with an
  empty value and break every form submission (loader no-ops, server
  gate 403s). Before any deploy, either delete that placeholder line
  (the live binding is already correct) or fill in the real site key —
  and verify the binding after deploying. Recorded in DEPLOY-PLAN.md.
