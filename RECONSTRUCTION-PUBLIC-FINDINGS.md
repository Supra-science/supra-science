# Public additions — Nov-8 live bundle reconstruction (findings)

Scope: the **public** additions in the Nov-8 live Cloudflare Workers bundle
(`/tmp/live-worker.js`, 8 MB) vs the Nov-5 base source at
`/tmp/z2/supra-science-platform-integration/`. Reconstructions are clean
TypeScript/TSX rewrites (not minified code copied verbatim) in
`/tmp/recon-public/`, mirroring the `src/` layout. All user-visible strings
were taken verbatim from the bundle (EN and AR). No prices, clients,
testimonials or features were invented. No secrets are included — env var
names only. Nothing was deployed, pushed, or modified outside
`/tmp/recon-public/`.

## Correction to the task premise

**`src/app/ar/page.tsx` is NOT new in Nov-8.** It exists in the Nov-5 base
(275 lines) and in the live bundle (module 79157). It is therefore treated
as a **shared page** (diff summary below), not a brand-new file, and no full
reconstruction of it is included. All other "new" files in the task were
verified present in the bundle; `faq-section`, `free-offers` and
`use-page-title` exist as compiled chunks even though they do not appear in
the bundle's `[project]` source-path list (`live-src-paths.txt`).

## Method

- App/route entry files in the bundle are Turbopack manifests; the real code
  lives in hashed `[root-of-the-server]__*.js` / `_*.js` chunks as numbered
  modules. Modules were located by their `a.r(<id>)` / `e.r(<id>)` references
  and extracted with a brace-counting extractor (`/tmp/extract_mod.py`,
  written for this task) or `extract.py` for single-module SSR chunks.
- Arabic strings in the bundle are `\uXXXX`-escaped; they were decoded
  before transcription. The 248-entry country list in `contact-form.tsx`
  was generated programmatically from the decoded bundle text (exact).
- Verification: `tsc --noEmit` (TypeScript 5.9, standalone, no
  `node_modules` in the recon dir) reports **no syntax errors** — the only
  remaining errors are missing-module errors for `next/*`, `react`,
  `@supabase/supabase-js` and the lib modules that other agents own
  (`@/lib/booking`, `@/lib/calendar`, `@/lib/ai-engine`, `@/lib/rate-limit`,
  `@/lib/email`, `@/lib/services`), plus implicit-`any` knock-ons from those
  unresolved imports. The files have not been compiled inside the real
  Next.js project or run.

## Per-file evidence (brand-new files)

| File (recon) | Bundle evidence |
|---|---|
| `src/app/book/page.tsx` | App-page template module 70553; body module 59800; metadata title "Book a free consultation", canonical `/book`, `x-default: /ar/book` |
| `src/app/ar/book/page.tsx` | Template module 56182; body module 88721; metadata title "احجز استشارة مجانية", canonical `/ar/book` |
| `src/components/booking-form.tsx` | SSR chunk `src_components_booking-form_tsx_06_ivixzmzcw_._.js`, module 49517, export `BookingForm` |
| `src/app/api/bookings/route.ts` | Route module 35578; userland module 76886 (POST only, `force-dynamic`) |
| `src/app/api/bookings/slots/route.ts` | Route module (slots); userland module 89611 (GET only, `force-dynamic`) |
| `src/components/contact-form.tsx` | SSR chunk `src_components_contact-form_tsx_1dir1pfba2qfx._.js`, module 45473, export `ContactForm` |
| `src/components/faq-section.tsx` | SSR chunk `src_components_faq-section_tsx_0qjtj8_iw_yaw._.js`, module 62531; default export + named export `F` (JSON-LD) |
| `src/components/free-offers.tsx` | SSR chunk `src_components_free-offers_tsx_0k1qzop3edhfx._.js`, module 21912; single export `f` |
| `src/app/not-found.tsx` | Module 3363 (in `[root-of-the-server]__0z8wi_caqm7qm` chunk); reads `x-pathname` header |
| `src/app/ar/not-found.tsx` | SSR chunk `src_app_ar_not-found_tsx_118jbgvrp80t9._.js`, module 75789 |
| `src/components/not-found-content.tsx` | Chunk `src_1mo0iqkjfeles._.js`, module 1073, default export; client component |
| `src/app/api/lang/route.ts` | Route module; userland module 75232 (GET only) |
| `src/app/api/ai/public-assistant/route.ts` | Route module 73049; userland module 3455 (GET + POST, `force-dynamic`) |
| `src/lib/use-page-title.ts` | SSR chunk `src_lib_use-page-title_ts_0mkwp8s3bzvyr._.js`, module 34737, export `f` |

## What each new file does

### Booking — `book/page.tsx`, `ar/book/page.tsx`, `booking-form.tsx`, `api/bookings/*`
- Free 30-minute consultation on Google Meet, Sun–Thu 10:00–18:00 Aden
  time (UTC+3). Pages are thin server components: `SiteNav` + hero copy +
  `<BookingForm lang>` + `SiteFooter`. EN hero eyebrow "Free consultation",
  H1 "Book a consultation"; AR "استشارة مجانية" / "احجز استشارة".
- `BookingForm` (`"use client"`): topic select (6 topics — general,
  digital-products, software-ai, embedded-iot, scientific, automation —
  with EN/AR labels), day select (next 15 days, Sun–Thu only, Aden time),
  slot buttons fetched from `/api/bookings/slots?date=`, name / email /
  phone fields. On mount it probes days in order and pre-selects the first
  day with free slots. Submit POSTs `/api/bookings` with
  `{name, email, phone?, topic (localised label), service_slug, start,
  recaptcha_token}` (token action `"booking"`). Success view shows the
  booked time (Intl, `Asia/Aden`), "Join Google Meet" + "Copy link"
  (2 s "Copied" state) and "Book another consultation" (resets
  name/email/phone/slot/meet link, keeps topic/day).
- `GET /api/bookings/slots?date=YYYY-MM-DD`: rate-limit 10/min per IP
  (`slots:<ip>`); 400 unless the date parses and is a working day
  (Sun–Thu); empty slot list is a valid 200; 503 if calendar booking is
  not configured or the calendar cannot be read; returns only slots not
  overlapping existing calendar events for the whole Aden day
  (07:00–21:00 UTC window).
- `POST /api/bookings`: rate-limit 5/10 min per IP (`booking:<ip>`, 429);
  validate payload (400); the requested start must still be a generated
  slot for its Aden day (409); reCAPTCHA verify (403 unless the gate is
  not configured — see below); 503 if calendar not configured/unreadable;
  re-check overlap (409 if just taken); create the Google Calendar event
  (`"Supra-Science consultation — {name}"`, Meet link); insert into
  `consultation_bookings` (`status: "booked"`, `email_sent: false`);
  duplicate-key → delete the calendar event, 409; send visitor
  confirmation + admin notification (best-effort) and update `email_sent`;
  any DB failure deletes the calendar event again (503). Response
  `{ok, meetLink, scheduledAt, emailSent, note}`.
- Booking logic itself lives in `src/lib/booking.ts` and
  `src/lib/calendar.ts` (another agent's scope). The routes/form call:
  booking lib — validate, Aden-day-of-ISO, generate-slots, overlap-check,
  30-minute slot constant; calendar lib — is-configured, list-events,
  create-event, delete-event. See the export-letter mapping below.

### Contact form — `components/contact-form.tsx`
- Extracted from Nov-5's inline form in `app/contact/page.tsx` (which is
  now a server component rendering `<ContactForm lang>`).
- Adds: client-side validation with inline per-field errors (name ≥ 2,
  email regex, subject ≥ 3, message ≥ 10; first invalid field focused),
  a country-code phone input (248 countries, iso/dial/EN/AR names,
  US-first ordering then a 54-country priority list, longest-dial-prefix
  detection when pasting `+…`), preferred-contact options
  email / WhatsApp / **Google Meet** (Nov-5 had "Phone call"), reCAPTCHA
  token action `"contact"`, and a reCAPTCHA note with Google Privacy /
  Terms links. Success view: "Received ✓ / Thank you." + server note.
- `POST /api/contact` (Nov-5 route, **changed** in Nov-8): same rate
  limit (5/10 min, `contact:<ip>`) and validation via `src/lib/email.ts`,
  then a new reCAPTCHA step — `verifyRecaptcha(token, ip)`, 403
  "Human verification failed…" unless the gate is not configured — and
  `preferred_contact` now accepts `email | whatsapp | meet` (was
  `email | whatsapp | call`). Supabase fallback URL is now the hardcoded
  project URL `https://ityzbuncztwgtxudcobr.supabase.co` (Nov-5 fell back
  to `NEXT_PUBLIC_SUPABASE_URL`). Response unchanged
  (`{ok, emailSent, inbox, note}`).

### FAQ + free offers — `faq-section.tsx`, `free-offers.tsx`
- `FaqSection`: 11 Q&As in EN and AR (start/cost/timeline/bilingual/AI/
  hardware/medical-certification/communication/ownership/after-delivery/
  payments). Payments answer now says bank transfer, cash pickup or USDT
  and "We never ask for or store card numbers" (Nov-5's FAQ said "hosted
  payment links from an approved provider"). Renders `<details class="tile">`
  items; `FaqJsonLd` emits a schema.org `FAQPage` script for the same list.
  Used by the EN + AR home pages and the `/faq` + `/ar/faq` pages.
- `FreeOffers`: "Free to start" panel — 5 offers (free consultation,
  free scope review, free architecture draft, pay only after approval,
  free written quotation) linking to `/book` / `/start` (AR: `/ar/book` /
  `/ar/start`), plus WhatsApp CTA. Used by the EN + AR home pages and
  the `/services` + `/ar/services` pages.

### 404 — `not-found.tsx`, `ar/not-found.tsx`, `not-found-content.tsx`
- Root `not-found.tsx`: async server component, reads the `x-pathname`
  header and renders `<NotFoundContent initialIsAr={pathname starts with
  "/ar"} />`. Metadata: title "Page not found", `robots: {index: false,
  follow: true}`.
- `NotFoundContent` (client): detects AR from `usePathname()` (falls back
  to `initialIsAr` when the pathname is unavailable), sets
  `document.title` via `usePageTitle` ("Page not found | Supra-Science" /
  "الصفحة غير موجودة | سوبرا-ساينس"), renders `SiteNav`/`SiteFooter` in
  the detected language with "Return Home / Explore Services" links.
- `ar/not-found.tsx`: a separate **static** Arabic page (does not use the
  shared component), same copy/layout, metadata title "الصفحة غير موجودة".
- The `x-pathname` header is set by the Nov-8 middleware (see Language).

### Language — `api/lang/route.ts` (+ middleware behaviour, for context)
- `GET /api/lang?to=en|ar&next=/path`: sets cookie `ss-lang` (`"en"` only
  if `to` is exactly `"en"`, otherwise `"ar"`; path `/`, maxAge 31536000,
  sameSite lax) and redirects to `next` (only a same-site path is
  honoured, else `/`).
- The Nov-8 middleware (not in this recon's file list, but it is what
  makes the route work): for the public paths
  `/, /services, /about, /process, /faq, /contact, /privacy, /terms,
  /login, /signup, /forgot-password, /start, /book`, if the `ss-lang`
  cookie is **not** `"en"` it redirects to `/ar…` (root → `/ar`). So the
  **default language is Arabic** unless the cookie is `en` — consistent
  with every Nov-8 page metadata using `"x-default": "/ar/…"`. It also
  sets the `x-pathname` request header used by the 404 page, then runs
  the Supabase session update. Nov-5 middleware had no language logic.
- `SiteNav`/`SiteFooter` (see diffs) now link the switcher to
  `/api/lang?to=…&next=…` instead of linking directly to `/` / `/ar`.

### Public AI assistant — `api/ai/public-assistant/route.ts`
- Anonymous (no auth, no DB, no persistence). `POST` body:
  `{message (1–2000 chars), history (last 6, user/assistant only, each
  ≤ 1000 chars), lang ("en" → en, anything else → ar), recaptcha_token}`.
  Rate-limit 10/10 min per IP (`public-ai:<ip>`, 429). Invalid message →
  400. reCAPTCHA verify → 403 unless not configured. Engine fallback
  chain: Workers AI (model `@cf/meta/llama-4-scout-17b-16e-instruct` in
  the ai-engine lib) → Gemini (`GEMINI_API_KEY`) → OpenAI direct call
  (`gpt-4o-mini`, max_tokens 800, temperature 0.6) → local rule-based
  reply. Response `{reply, engine}`. `GET` returns
  `{configured: true, engine}` for the first engine available.
- System prompt: same five service domains and hard rules as the authed
  assistant, **plus** a "PUBLISHED STARTING PRICES (USD, indicative — you
  MAY quote these)" block built by the ai-engine lib from the service
  list (`- {title}: starting from $X,XXX` per service) and a "FREE TO
  START" block (free consultation, free scope review, free architecture
  draft, no payment before scope approval, free written quotation).
- Difference vs the authenticated `/api/ai/assistant` (Nov-5, also
  updated in Nov-8 to the same engine chain + price block): the authed
  route requires a Supabase session (401), takes `conversation_id`,
  verifies ownership against `auth.uid()`, reads/writes history in
  `ai_messages` (12-message cap, 4000-char cap), and its Nov-5 prompt
  forbade inventing *any* prices. The public route has none of that.
- Client caller: a floating assistant widget rendered inside `SiteFooter`
  (see site-chrome diff). It posts `{message, history (last 6), lang,
  recaptcha_token}` (action `"public_assistant"`, 60 s abort timeout),
  with strings from `src/lib/i18n.ts` (`paTitle`, `paGreeting`,
  `paPlaceholder`, `paNote`, `paPrivacy`, `paTooMany`, `thinking`,
  `send`, `dismiss`, `requestFailed`, `requestTimedOut`, `messageTooLong`,
  `somethingWrong`, `paOpen`, `paClose`). The widget itself is part of
  the site-chrome diff, not a separate file in this recon.

### `use-page-title.ts`
- One hook: `usePageTitle(title)` → `useEffect(() => { document.title =
  title }, [title])`. Used by `NotFoundContent` (only caller found in the
  public bundle).

### Supporting file — `lib/recaptcha.ts` (partial reconstruction)
- Written because the booking/contact/intake/public-assistant code all
  import it. The **server** verifier is recovered in full from bundle
  module 64408: env `RECAPTCHA_SECRET_KEY`; unset → `{verified: false,
  reason: "not_configured"}` (callers treat as "gate skipped"); no token
  → `missing_token`; POSTs `https://www.google.com/recaptcha/api/siteverify`
  (urlencoded `secret`/`response`/`remoteip`); verified only when
  `success === true` and v3 `score >= 0.5` (`low_score` / `failed` /
  `error` otherwise).
- The **client** helpers (`getRecaptchaToken(action)`,
  `loadRecaptcha()`) are only present in the bundle as the SSR stub
  (token → `null`, load → no-op). See Gaps.

## Minified export-letter mapping (lib names are NOT recoverable)

The bundle minifies export names to single letters. Reconstructions use
descriptive names and carry a `TODO(RECONSTRUCTION-GAP)` comment; they
must be aligned with the lib reconstructions:

| Lib (owner: other agent) | Minified export | Behaviour / descriptive name used |
|---|---|---|
| `lib/booking.ts` | `B` (= 30) | `SLOT_MINUTES` |
| | `W` | `parseDate` ("YYYY-MM-DD" → `{y,m,d,weekday}` or null) |
| | `D` | `isWorkingDay` (Sun–Thu) |
| | `T` | `slotsOverlap` (start/end × start/end) |
| | `j` | `adenDateOf` (ISO → Aden "YYYY-MM-DD") |
| | `p` | `generateSlots` (10:00–18:00 Aden, 30-min steps, ≥ now+2h, within 14 days) |
| | `v` | `validateBooking` (name/email/topic/phone/start) |
| | `u` | date-time formatter (Intl, Aden) |
| `lib/calendar.ts` | `j` | `isCalendarConfigured` (Google Calendar client id/secret/refresh token present) |
| | `K` | `listCalendarEvents` (from/to → events or null) |
| | `e` | `createCalendarEvent` (→ `{eventId, meetLink}` or null) |
| | `s` | `deleteCalendarEvent` |
| `lib/email.ts` | `m` | `validateContact` |
| | `A` | `sendContactNotification` |
| | `F` | `sendBookingConfirmation` |
| | `H` | `sendBookingAdminNotification` |
| | `o` | `BUSINESS_EMAIL` |
| `lib/ai-engine.ts` | `M` | `formatStartingPrices(lang)` |
| | `a` | `chatWithWorkersAI` |
| | `z` | `chatWithGemini` |
| | `l` | `ruleBasedReply` |
| | `u` | `isWorkersAIAvailable` |
| `lib/rate-limit.ts` | `f` | `isRateLimited(key, {windowMs, max})` (in-memory Map) |
| `lib/recaptcha.ts` (server) | `f` | `verifyRecaptcha` (see above) |
| `lib/recaptcha.ts` (client) | `j` / `W` | `getRecaptchaToken` / `loadRecaptcha` |
| `lib/i18n.ts` | `f` | strings object (incl. all `pa*` keys) |
| `lib/services.ts` | `c` / `b` | `getServices(lang)` / service lists (see Prices) |

Original export names for `faq-section` (default + `F`), `free-offers`
(`f`) and `use-page-title` (`f`) are likewise unrecoverable; the recon
uses `FaqSection` / `FaqJsonLd`, `FreeOffers`, `usePageTitle`.

## Shared-page diffs (Nov-5 → Nov-8, live bundle vs base source)

- **`src/app/page.tsx` (home)**: hero reworded ("We design and build
  connected technology — software, intelligence, and hardware, one team,
  one system, one accountable delivery."; lead reworded; `reveal` classes
  added); stat strip reworded ("One team / fully accountable",
  "Quotations built on scope"); services section renamed "Our strengths"
  and each card now shows an image (`/services/*.jpg|png`, 800×533/800)
  and "Starting from $X" + the indicative-price note; new tile "Not sure
  where to start?"; new `<FreeOffers lang="en"/>` section; evaluation
  heading "How we rigorously evaluate your project", texts expanded;
  "Why" heading "Built on clarity and commitment"; leadership block now
  uses the photo `/leadership/dr-faisal-alradaei.webp` (600×600) instead
  of the "F" brandmark tile; new FAQ section (`<FaqSection/>` +
  `<FaqJsonLd/>`, "Questions, answered."); contact section reworded
  ("Talk to Supra-Science", WhatsApp link now carries a prefilled
  `?text=` message); metadata description reworded, alternates add
  `"x-default": "/ar"`.
- **`src/app/ar/page.tsx`**: mirrors the EN home in Arabic (same
  sections, prices, images, FreeOffers/FAQ, leadership photo with alt
  "د. فيصل الرداعي", "المدير — سوبرا ساينس"); metadata title uses
  `absolute` (not `default`/`template`).
- **`src/app/services/page.tsx`**: `ServiceBlock` now renders the
  service image and a price row ("Starting from $X" + `priceNote`);
  `<FreeOffers lang="en"/>` inserted after the service list; H1 "scoped
  with precision and honesty" (was "scoped honestly"); lead reworded to
  mention indicative starting prices; CTA panel "quoted as it deserves"
  (was "quoted properly"); metadata title shortened to "Services",
  alternates add `"x-default": "/ar/services"`. Data still comes from
  `getServices("en")` — the new `startingPriceUsd` / `image` /
  `imageWidth` / `imageHeight` / `priceNote` fields are a lib change.
- **`src/app/start/page.tsx`**: structure unchanged (IntakeWizard +
  "Prefer talking to a human first?" line); metadata title shortened to
  "Start your project", alternates add `"x-default": "/ar/start"`.
  (AR start keeps the "| سوبرا-ساينس" title suffix.)
- **`src/app/process/page.tsx`**: copy of the 7 phases and CTA appear
  unchanged (minor rewording in phase texts, e.g. phase 01 "the decisive
  questions"); metadata title shortened to "How we work", alternates add
  `"x-default": "/ar/process"`.
- **`src/app/faq/page.tsx`**: the inline 11-item QA list is replaced by
  `<FaqSection lang="en"/>` + `<FaqJsonLd lang="en"/>`; lead reworded
  ("The questions clients ask before they decide. Anything else — ask us
  directly — we answer plainly."); metadata title shortened to "FAQ",
  alternates add `"x-default": "/ar/faq"`. (AR faq mirrors this with
  `lang="ar"`, title "الأسئلة الشائعة | سوبرا-ساينس".)
- **`src/app/contact/page.tsx`**: now a server component rendering
  `<ContactForm lang="en"/>` in the panel (was a `"use client"` page with
  the inline form); lead reworded ("Tell us about your project — and the
  people building it will reply, in English and Arabic — نرد بالعربية
  والإنجليزية."); metadata title shortened to "Contact", description now
  mentions Google Meet, alternates add `"x-default": "/ar/contact"`.
  (AR contact mirrors this with `lang="ar"`.)
- **`src/app/layout.tsx`**: site URL is now hardcoded
  `https://supra-science.supra-science.workers.dev` (Nov-5 used
  `NEXT_PUBLIC_SITE_URL` with a `goodyour583` fallback); description
  drops "Yemen" from the served-countries list; Open Graph/Twitter images
  added (`/og-image.png`, 1200×630); Google Fonts preconnects + stylesheet
  (DM Sans, Manrope, Amiri) added in `<head>`; a second JSON-LD
  `ItemList` of services (from `getServices`, with `offers.price` =
  `startingPriceUsd` USD) added next to the `Organization` JSON-LD.
- **`src/components/site-chrome.tsx`**: language switcher now goes via
  `/api/lang?to=en&next=/` / `/api/lang?to=ar&next=/ar` (with `lang`
  attribute) instead of direct `/` / `/ar` links, in both desktop and
  mobile menus; **`SiteFooter` now renders a floating public-AI-assistant
  widget** (`.pa-root`, bottom corner — left for AR, right for EN;
  toggle FAB "✦"/"✕", dialog with message list, input, 60 s timeout,
  reCAPTCHA action `"public_assistant"`, strings from `lib/i18n.ts`).
  Nav items, brand, footer links and copyright line are otherwise
  identical to Nov-5.
- **`src/components/intake-wizard.tsx`**: copy/steps/domains unchanged
  (same 4 steps, budgets, timelines, rule-based draft); the contact-form
  submission now attaches a reCAPTCHA token (action `"intake"`) and shows
  the reCAPTCHA note.
- **`src/components/hero-visual.tsx`**: unchanged (same inline SVG,
  node positions, labels, colours — verified identical).

## Prices — where they come from

The live prices ($3,500 digital products, $4,500 software & AI, $3,500
embedded & IoT, $6,500 scientific, $1,500 automation) are **hardcoded in
the services data** (`lib/services.ts` / ai-engine fallback list), not in
the database: the services lib fetches the Supabase REST `services` table
(`is_active`, `sort_order`, 300 s revalidate) and falls back to the
hardcoded EN/AR lists (which carry `startingPriceUsd` + the shared
`priceNote` "Indicative starting price — the final price is set in your
written quotation after we review the scope."). Home, services and
layout JSON-LD all render those same values. The DB `services` table has
no price column (per the 2026-11-09 audit), so the live prices cannot
come from it.

## Gaps / uncertainties

1. **Client reCAPTCHA implementation** (`getRecaptchaToken` /
   `loadRecaptcha`): not recoverable from the server worker bundle — no
   `grecaptcha` string and no `NEXT_PUBLIC_RECAPTCHA_*` env name occur
   anywhere in it. The recon keeps the exact call sites/actions and a
   stub matching the SSR-observable behaviour, marked
   `TODO(RECONSTRUCTION-GAP)`. Recover from the browser client chunks.
2. **Lib export names**: all `lib/*` function names in the routes are
   descriptive reconstructions from minified single-letter exports (table
   above). They must be reconciled with the lib reconstructions.
3. **Component export names**: `FaqSection`/`FaqJsonLd`, `FreeOffers`,
   `usePageTitle` are best-guess names (bundle keeps only `p`/`F`/`f`).
4. **Booking-form probe semantics**: the bundle's probe effect sets the
   "settled" flag after the loop in all cases; the recon follows that.
   Whether the original had a separate "no slots on any day" UI state is
   not visible — there is none in the bundle (the form just shows the
   first day's slots/error).
5. **Not-found `x-pathname`**: depends on the Nov-8 middleware setting
   that header (verified present in the bundle's middleware chunk) — the
   middleware file itself is outside this recon's scope.
6. **CSS classes** (`panel`, `tile`, `offer-grid`, `pa-*`, `phone-row`,
   `service-img-wrap`, `leader-photo`, `reveal`, etc.) are referenced as
   in the bundle; their definitions live in `globals.css` (not in scope)
   and were not verified.
7. Not verified by running: no build, no dev server, no deployment (per
   task). `tsc` standalone check only (see Method).

## Files written (in `/tmp/recon-public/`)

- `src/app/book/page.tsx`
- `src/app/ar/book/page.tsx`
- `src/components/booking-form.tsx`
- `src/app/api/bookings/route.ts`
- `src/app/api/bookings/slots/route.ts`
- `src/components/contact-form.tsx` (incl. 248-country list)
- `src/components/faq-section.tsx`
- `src/components/free-offers.tsx`
- `src/app/not-found.tsx`
- `src/app/ar/not-found.tsx`
- `src/components/not-found-content.tsx`
- `src/app/api/lang/route.ts`
- `src/app/api/ai/public-assistant/route.ts`
- `src/lib/use-page-title.ts`
- `src/lib/recaptcha.ts` (supporting file: full server verifier + stubbed
  client helpers, see Gaps #1)
- `PUBLIC-FINDINGS.md` (this file)
