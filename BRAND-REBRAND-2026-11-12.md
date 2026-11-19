# Connected Titanium rebrand — dev tree only (2026-11-12)

Proposal: `~/workspace/goals/supra-science-platform-launch-readiness/files/brand-identity-proposal-2026-11-12.md`.
Status: applied to the dev tree ONLY. Nothing deployed, nothing changed live.
Live site still runs v47 (black/gold) until the user approves a deploy.

## Palette (replaces black/gold everywhere)
- Primary Deep Navy `#0B2447` — nav, section headers, prominent text.
- Secondary Tech Blue `#576CBC` — icons, service cards, H2/H3, admin accent links.
- Accent Electric Cyan `#19A7CE` — CTAs and links only.
- Backgrounds Off-White `#F6F6F6`; body text Charcoal `#1E2022`.
- `--gold` / `--gold2` are legacy CSS variable names kept so existing
  `className="gold"` and `var(--gold)` usages keep working: `--gold` is now
  cyan (borders/fills), `--gold2` is now navy (accent text). No gold hex
  remains in `src/` (verified by grep; the only gold word left is in
  comments/history docs, not in code).

## Fonts (root layout + globals.css)
- IBM Plex Sans Arabic — Arabic headings/UI (RTL body stack).
- Tajawal — Arabic body.
- Inter — English body.
- Roboto Mono — numbers/prices (`.price-tag`, `.stat strong`, `.num` utility).
- Old fonts removed: Manrope, Amiri, DM Sans, Noto Sans Arabic (no references left in `src/`).

## Wordmark
- Logo lockup separator is now a slash: `SUPRA/SCIENCE` (slash in cyan,
  `SCIENCE` in navy) in the header, auth pages, dashboard pages and admin
  layout — 15 lockups total, 0 hyphen lockups left.
- Brand NAME in page text, titles and metadata stays `Supra-Science` /
  `سوبرا-ساينس` unchanged.
- RTL logo fix preserved: `.brand` keeps `direction:ltr; unicode-bidi:isolate`
  and there is NO `[dir="rtl"] .brand` row-reverse rule.

## Other changes
- Full light-theme flip: dark panels/inputs/cards (`#111319`, `#090b10`,
  `#0a0a0a`, `#1a1a1a`) became white/`#F6F6F6`; light text on dark
  (`#f5f5f4`, `#d9dbe0`, `#b5bac4`) became charcoal; white-alpha borders
  became navy-alpha borders. Admin (`admin-styles.ts`, admin layout, all
  admin pages) flipped the same way, including light-theme status pills
  (green/red/amber semantics kept, light backgrounds).
- Hero SVG (`hero-visual.tsx`) recolored: cyan dots/glow/rings/links, navy
  pulses and core "S", white node cards, charcoal labels, Inter / IBM Plex
  Sans Arabic fonts.
- AI assistant brand context in both API routes: "black and gold" →
  "deep navy, tech blue and electric cyan".
- Email templates (`src/lib/email.ts`): gold headings/borders → navy/cyan.
- Starter prices unchanged: $3,500 / $4,500 / $3,500 / $6,500 / $1,500.
- No functionality, routes, API logic, reCAPTCHA, catalog or copy changed.
  No Stripe code added. No secrets, `.env.local`, `wrangler.jsonc` touched.

## Verification (2026-11-12, dev tree)
- `npm test`: 119/119 pass (18 suites), 0 fail. No test updated — tests
  assert no font/color values.
- `npm run build`: exit 0, 38/38 pages.
- Built CSS: navy 21x, cyan 22x, 0 old gold/black hexes; font @import is
  the new 4-family set.
- Smoke test (`next start -p 3123`, then stopped): `/ar` 200 renders the
  `SUPRA/SCIENCE` lockup and the new font link; `/` 307; `/ar/services`
  200 with `.price-tag`. Server stopped, port free.

## Pending / deliberately NOT done
- Photography direction (real macro hardware shots, navy `#0B2447` overlays):
  needs real photos we do not have. No stock or generated images used.
- Line-art / wireframe methodology illustrations: not generated; needs
  real design work.
- `public/favicon.svg`, `public/favicon.ico`, `public/apple-touch-icon.png`,
  `public/og-image.png`: still black/gold artwork. Not regenerated —
  needs a design decision (recreate the "S" mark in navy/cyan or keep).
- Contrast note for review: accent cyan `#19A7CE` as small body-link text
  on `#F6F6F6` is ~2.4:1 (below WCAG AA 4.5:1 for normal text). CTA
  buttons use navy text on cyan (good contrast); if the user finds links
  hard to read, darken link cyan to `#0E7FA0` or use tech blue for links.

## Follow-up fixes — 2026-11-12 (approved by the user: "نعم اصلح كل شيء والخطوط ايضا موافق")

- **Body-link contrast fixed:** the 5 small inline links that were cyan #19A7CE on #F6F6F6 (~2.4:1) are now tech blue #576CBC (~4.6:1, WCAG AA): `/ar/book` (contact + WhatsApp), `/book` (contact + WhatsApp), admin `/bookings` (Google Meet link). Cyan stays for CTAs, buttons and large accents only. Palette comment in `src/app/globals.css` updated to state the rule.
- **Brand assets regenerated in navy/cyan** (were black/gold): `public/favicon.svg` (navy rounded square, cyan ring, white S), `public/favicon.ico` (multi-size 16/32/48), `public/apple-touch-icon.png` (180×180), `public/og-image.png` (1200×630, navy bg, cyan frame + diamond S, white SUPRA + cyan slash + white SCIENCE, same taglines). `public/site.webmanifest` theme/background colors updated #0b0d12 → #0B2447.
- **Fonts confirmed:** the four new families (IBM Plex Sans Arabic, Tajawal, Inter, Roboto Mono) were already in `src/app/layout.tsx` from the rebrand — user approved them as-is, no change needed.
- Verified after these fixes: `npm test` 119/119, `npm run build` exit 0. Still dev tree only — nothing deployed to live.
