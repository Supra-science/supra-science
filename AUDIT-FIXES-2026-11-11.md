# Audit fixes — 2026-11-11 (report "تقرير 5.5 opus")

Verified every claim against this tree + the live site before fixing.
Report was right on most SEO/layout items, wrong on 4 points (see §3).

## Fixed in this tree (dev only — nothing deployed)

1. `lang="ar" dir="rtl"` from the server: root layout now reads the
   `ss-lang` cookie and renders `<html lang dir>` accordingly (was
   hardcoded `lang="en"`). Verified locally: `/ar/contact` → `lang="ar"`,
   `/contact` with `ss-lang=en` → `lang="en"`.
2. Titles now carry the brand: `/ar/layout` title is now
   `{ default, template: "%s | سوبرا-ساينس" }`. Verified:
   "تواصل معنا | سوبرا-ساينس", "احجز استشارة مجانية | سوبرا-ساينس",
   EN "Contact | Supra-Science".
3. Login canonical bug: `/ar/layout` set `canonical: "/ar"` for ALL /ar
   pages (live `/ar/login` canonicalised to `/ar`). Removed from the
   layout; auth pages now have their own `layout.tsx` with an absolute
   title + `robots: noindex, follow` (ar/login, ar/signup,
   ar/forgot-password, login, signup, forgot-password).
4. Sitemap: only final `/ar/*` URLs now (10 entries, incl. `/ar/book`
   which was missing); removed `/`, `/ar/`, all non-/ar paths and the
   auth pages. Fallback base URL fixed to
   supra-science.supra-science.workers.dev.
5. Favicon + app icons + manifest: `public/favicon.svg`,
   `public/favicon.ico`, `public/apple-touch-icon.png`,
   `public/site.webmanifest` (black/gold "S"), linked in the root layout.
   All return 200 locally.
6. `/ar/start` and `/start`: added a real `<h1>` (was missing).
7. Contact hero: `align-items: start` so the heading aligns with the top
   of the form instead of sitting vertically centred (ar + en).
8. Booking form: wrapped in a max-width 1180 container with side
   padding (was edge-to-edge, the `<form class="panel">` sat directly in
   the unpadded `.shell`) (ar + en).
9. Phone field: the `<input type="tel">` now has an explicit
   `aria-label` (the wrapping `<label>` only associated with the country
   `<select>`, the first labelable descendant).
10. "Why us" grid: 4 items in a 3-column `.tiles` grid left an orphan;
    switched to `.tiles-2` (2x2) in ar + en homepages.
11. `.tiles-4` (4-gate evaluation) had no mobile rule and stayed 4
    columns on phones; now 2 columns under 800px.
12. Brand logo RTL break: `.brand` now forces `direction: ltr;
    unicode-bidi: isolate` (the `SUPRA<span>-SCIENCE</span>` dash moved
    in RTL context).
13. Footer email: `white-space: nowrap` on the mailto link (was breaking
    into "-Supra" / "science@proton.me" on mobile).
14. Floating assistant button: text glyph `✦`/`✕` replaced with inline
    SVG icons (the glyph rendered as an empty box in the audit browser).
15. reCAPTCHA badge: `.grecaptcha-badge{visibility:hidden}` — the
    required disclosure text with Privacy/Terms links already existed in
    the contact, booking and intake forms; added the same disclosure
    line to the public-assistant panel, which lacked it.
16. Wording: removed "مساعد قاعدي — لا يُستخدم أي API مدفوع" /
    "Rule-based — no paid AI" from the intake wizard subtitle and both
    start-page meta descriptions.
17. Fonts: dropped DM Sans from the Google Fonts request (Manrope +
    Amiri only). DM Sans was requested but never used.
18. Open Graph: root layout `locale: en_US` + `url`; `/ar` layout
    `locale: ar_AR` + `url`. Removed the useless `keywords` arrays.
19. Organization JSON-LD: added `logo` (og-image.png) and `sameAs`
    (verified Facebook page https://www.facebook.com/Dr.Faisal57).
20. Images: all 5 service images converted to WebP (quality 80):
    1,007 KB → 270 KB (-73%); automation.png 711 KB → 76 KB.
    References updated in `src/lib/services.ts` and both homepages;
    old JPG/PNG files deleted.
21. 404: root `not-found.tsx` now uses `generateMetadata()` reading the
    `x-pathname` header — Arabic title for `/ar/...` 404s (was English
    "Page not found" in raw HTML). Verified locally.
22. Tests: updated the sitemap test to the final-URL set. `npm test`
    119/119, `npm run build` exit 0.

## Verified, no change needed

- RLS: enabled on all 19 public Supabase tables (checked live via API).
- Service-card images: already uniform — `.service-img-wrap img`
  has `aspect-ratio: 16/9; object-fit: cover` in the live CSS.
- "Free offers" grid: already `auto-fit`, no orphan.
- reCAPTCHA disclosure text: already present in contact/booking/intake.
- Login/signup rate limiting: Supabase Auth enforces its own limits;
  AI routes already have an app-level limiter (`src/lib/rate-limit`).

## NOT done — needs his decision / facts

- `/en/...` routes: English is still cookie-only and unindexable. Real
  fix = a proper `/en` route tree (a day+ of restructuring + re-test).
- Custom domain (`supra-science.com`): costs money — conflicts with
  the $0 budget; needs his explicit decision + purchase.
- Case studies / testimonials / legal entity / director qualifications /
  real numbers: only he can supply them; nothing invented.
- Google Search Console: guidance only (no account changes without him).
- Caching `s-maxage`: NOT applied — pages are auth-aware, caching HTML
  could leak logged-in content.
- CSP nonce / HSTS preload / COOP: header hardening, separate task.
