# Supra-Science — Deploy Plan (reconstructed Nov-8 tree + catalog)

**Date:** 2026-11-09
**Tree:** `/home/hatch/workspace/supra-science-live-reconstruction/`
**Status:** Ready to review. **NOTHING HAS BEEN DEPLOYED.** Do not deploy
until the owner approves explicitly and the pre-deploy checklist (§4) is
complete. No database change is part of this plan.

## 1. What this version is

The reconstruction of the 2026-11-08 live deployment (the original source
was lost when the owner's Muse account was deleted), plus the work done
since on top of it:

- All Nov-8 live behaviour recovered from the deployed Worker bundle
  (`/book` + Google Calendar/Meet booking, service starter prices and
  images, reCAPTCHA v3, Gmail API mail, AI provider chain, Arabic-first
  root, admin console) — see RECONSTRUCTION-REPORT.md.
- WhatsApp Business catalog section + illustrative samples on
  `/services` and `/ar/services`, with a nav link (this session).
- reCAPTCHA v3 browser loader re-implemented (was a stub).
- Wording fixes: AR typo "الايريد" → "البريد"; stale "when SMTP is
  configured" → "via the Gmail API".
- Build fixes: `cancelCalendarEvent` alias, public-assistant
  `ChatMessage` type, `getWorkersAI` symbol cast, dead Stripe lib files
  deleted (Stripe stays removed by the owner's decision).
- AI assistant history bug fixed: exchanges are now persisted to
  `ai_messages` for every engine, not only the local fallback.

Verified in dev: `npm test` **119/119 pass**; `npm run build` exit 0,
**38/38 pages**; smoke test of the built app (redirects, pages, catalog
rendering in EN + AR, wa.me links) all pass; `npx opennextjs-cloudflare
build` exit 0 producing `.open-next/worker.js` (37 MB output, deleted
after verification — the tree stays source-only).

## 2. Exact diff vs the live site (what changes on deploy)

| Area | Live now (Nov-8) | After deploy |
|---|---|---|
| Services pages (`/services`, `/ar/services`) | Service blocks, prices, images, FreeOffers, CTA | + WhatsApp Business catalog section (`#catalog`): 5 cards SS-01..SS-05 with scope, "Price: Quoted after a scope review", per-card WhatsApp request links, 4 ordering steps, catalog/chat buttons; + 5 clearly-labelled hypothetical work samples (idea / typical scope / typical deliverables, badge + general notice + per-sample disclaimer) |
| Nav (EN + AR, desktop + mobile) | Home, Services, How we work, About, FAQ, Contact | + "WhatsApp Catalog" → `/services#catalog` / "كتالوج واتساب" → `/ar/services#catalog` |
| reCAPTCHA | Server gate only; browser loader was a stub in the reconstruction (live original loader unrecoverable) | Browser loader implemented: `api.js` loads once, token per form (`contact` / `booking` / `intake` / `public_assistant`); forms now actually submit a token instead of `null` |
| AI assistant (`/api/ai/assistant`) | AI replies returned but NOT saved to `ai_messages` (insert only in the fallback branch) | Every exchange (user + assistant) saved to `ai_messages` |
| Wording | AR typo "الايريد" in the AI engine contact string; "when SMTP is configured" in `messagesLead` | Fixed to "البريد" and "via the Gmail API" |
| Everything else | — | Unchanged: same routes, same services/prices/images, same booking flow, same admin console, same auth. Stripe stays removed. |

One wording deviation from the approved Muse-space catalog text: the
space said the items were "ready to be added to the official catalog
later — not yet added". The catalog setup in WhatsApp Manager was
completed on 2026-11-09 (5 items live in "Supra-Science Services", all
eligible, linked to +1 (917) 818-3426), so the site lead/note now say
the cards mirror the official catalog items. The owner can ask to
revert that sentence to the space wording.

## 3. How to deploy (when approved)

Preconditions: the checklist in §4 is done and the owner has said
"deploy" explicitly.

1. In the tree: `npm ci` (only if `node_modules/` is absent).
2. **Fix the reCAPTCHA site-key placeholder FIRST** (see §5 — do not
   skip this): in `wrangler.jsonc`, either delete the
   `"NEXT_PUBLIC_RECAPTCHA_SITE_KEY": ""` line (the live Worker already
   has the real key configured as a plain-text binding) or set it to
   the real site key value. Never commit the secret key anywhere.
3. Build + deploy from the tree root:
   `npx opennextjs-cloudflare deploy`
   (runs the OpenNext build and `wrangler deploy` to the `supra-science`
   Worker). Alternative: `npx opennextjs-cloudflare build` then
   `npx wrangler deploy`.
4. Verify immediately after deploy (live, read-only checks):
   - `https://supra-science.supra-science.workers.dev/` → 307 `/ar`;
     `/ar/services` 200 and contains `SS-01` and `wa.me/c/19178183426`;
     `/services#catalog` renders the catalog cards.
   - Submit the contact form in a real browser: must succeed (200),
     not 403 — this proves the reCAPTCHA loader + real site key work.
   - `/ar/book` loads; check one booking slot end-to-end only if the
     owner wants a live test booking (creates a real calendar event —
     agree it first, or test in dev only).
   - Confirm the Worker bindings still list `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`
     (non-empty), `RECAPTCHA_SECRET_KEY`, Gmail/Calendar OAuth, and the
     Supabase service-role secret (names only — never print values).
5. If anything in step 4 fails, roll back (§6) — do not hot-fix live.

No database migration is part of this deploy. The 9 SQL files
(001–008) in the Nov-5 package were **not** applied and are **not**
in this tree; the live database already has the 19 platform tables.

## 4. Pre-deploy checklist (all must be true)

- [ ] Owner approves the starter prices ($3,500 / $4,500 / $3,500 /
      $6,500 / $1,500) and the "no fixed prices" wording tension is
      resolved (see §7).
- [ ] Owner approves the deploy itself (explicit "deploy").
- [ ] Real-browser reCAPTCHA check: load a form page in a real
      browser with the real site key and confirm a submission succeeds
      (200, not 403). Still outstanding — no headless browser in the
      dev VM, so no real `grecaptcha.execute()` token has been produced.
- [ ] E2E flows exercised in dev against real services + a dev
      database (booking incl. Calendar event + Gmail confirmation,
      contact delivery, login, admin actions, assistant chat + history
      persistence). Still outstanding — needs real credentials and a
      dev database; none were used in this dev work by design.
- [ ] `wrangler.jsonc` site-key placeholder handled (§5).
- [ ] Owner confirms the catalog lead wording (official catalog live
      vs the space's "not yet added").

## 5. Deploy hazard — reCAPTCHA site key placeholder

`wrangler.jsonc` contains `"NEXT_PUBLIC_RECAPTCHA_SITE_KEY": ""`
(empty placeholder, comment: "fill in before deploying"). The live
Worker already has the real site key configured. Deploying as-is would
overwrite that binding with an empty value: the browser loader would
no-op, every form would submit a `null` token, and the server gate
(with the secret configured) would 403 every submission. Handle it in
step 2 of §3 and verify the binding after deploying.

## 6. Rollback

Current live version (the one this deploy would replace):

- **Worker `supra-science`, version 37, id
  `69e7f87a-ecc3-453b-af52-78fd5f9d5e4c`, deployed 2026-11-08 17:36 UTC
  via Wrangler (100%).**

Rollback (no code changes needed):

1. Cloudflare dashboard → Workers & Pages → `supra-science` →
   Deployments → find version 37 (`69e7f87a…`, 2026-11-08 17:36 UTC) →
   **Rollback** (or "Deploy" that version). This restores the exact
   Nov-8 code.
2. Alternative (CLI): `npx wrangler rollback --version-id
   69e7f87a-ecc3-453b-af52-78fd5f9d5e4c` from any machine with the
   Cloudflare API token.
3. Verify after rollback: home page loads, `/ar/services` 200, contact
   form behaves as before (reCAPTCHA gate as in the Nov-8 deployment).

Rollback is safe for data: this deploy writes no migrations and changes
no database schema. The only new writes it can produce are the ones the
live site already produces (contact messages, bookings, AI history) —
the AI-history fix only adds `ai_messages` rows that the Nov-8 code
failed to write; rolling back stops those writes, it does not delete
them.

## 7. Decisions still open for the owner

1. **Starter prices + wording:** approve $3,500 / $4,500 / $3,500 /
   $6,500 / $1,500 as published and resolve the tension with "We do
   not publish fixed prices" (the cards already carry the "Indicative
   starting price" note; the catalog cards say "Quoted after a scope
   review" with no figures).
2. **Deployment approval** (explicit).
3. **Supabase migrations:** the 9 SQL files (001–008) are not applied
   and not in this tree. No DDL on the production project
   (`Supra-science`, `ityzbuncztwgtxudcobr`, us-east-1) without the
   owner's explicit approval for that project.
4. **Catalog lead wording:** keep the updated "official catalog" text
   or revert to the space's "not yet added" wording (§2).
5. **Real-browser reCAPTCHA check + E2E flows** (§4) — who runs them
   and with which credentials/database.
6. `/favicon.ico` is 404 on the live site and was not restored (cosmetic).
7. Remaining `TODO(RECONSTRUCTION-GAP)` markers (guessed admin module
   filenames/export names, `ServiceList`/`InvoiceManager` imported
   as-is from Nov-5). None blocks the build.

## 8. Evidence trail

- RECONSTRUCTION-REPORT.md (§§3–4, §7) — what was recovered, gaps,
  decisions.
- BUILD-TEST-REPORT.md (§§1–9) — install, tests (119/119), builds
  (38/38), smoke tests, OpenNext packaging, the catalog/AI-fix session.
- RECAPTCHA-IMPLEMENTATION.md — loader implementation + server-gate
  tests with Google's public test keys (bogus/missing token → 403).
- This plan — diff, deploy steps, rollback to Worker version 37.
