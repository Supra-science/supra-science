# Supra-Science — reconstructed live source (2026-11-08)

Next.js App Router application using Supabase Auth and server-side authorization,
deployed on Cloudflare Workers (OpenNext). This tree is a reconstruction of the
2026-11-08 live deployment, built from the 2026-11-05 base source plus the
features recovered from the deployed Worker bundle. See
`RECONSTRUCTION-REPORT.md` for the evidence behind every recovered item and the
remaining gaps.

## Environment
Copy `.env.example` to `.env.local`. The publishable key is designed for browser use.
Never expose a Supabase secret/service-role key in `NEXT_PUBLIC_*`. No secret
values are stored in this repository — set them with `wrangler secret put`.

## Run
```bash
npm install
npm run dev
```

## Routes
- `/` brand landing page (Arabic by default; `/ar` is the Arabic section)
- `/book` free 30-minute consultation booking (Google Meet, Sun–Thu 10:00–18:00 Aden)
- `/services`, `/process`, `/faq`, `/about`, `/contact`, `/start`
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/dashboard` authenticated clients (projects, quotations, AI assistant, architecture studio)
- `/admin` private administrator console (bookings, consultations, messages,
  quotations, projects, invoices, users, WhatsApp, drafts, audit logs)

## Supabase setup
The connected project has the platform tables (`profiles`, `user_roles`,
`services`, `customers`, `projects`, `consultations`, `consultation_bookings`,
`quotations`, `invoices`, `payments`, `contact_messages`, `ai_conversations`,
`ai_messages`, `whatsapp_conversations`, `whatsapp_messages`, and others) with
RLS. New registrations are assigned `customer`. The administrator is the
allowlisted owner email `Supra-science@proton.me` (see `src/lib/admin-auth.ts`),
or any user with a `user_roles` row with role `admin`. Do not allow clients to
update `user_roles`.

## Booking
`/book` creates a `consultation_bookings` row, a Google Calendar event with a
Meet link, and confirmation emails via the Gmail API. Slots are 30 minutes,
10:00–17:30 Aden time, Sunday–Thursday, up to 14 days ahead, with a 2-hour
lead time. See `src/lib/booking.ts` and `src/lib/calendar.ts`.

## Contact form
Protected by reCAPTCHA v3 (score ≥ 0.5) and rate-limited (5 messages / 10 min
per IP). Notifications are sent via the Gmail API. See `src/lib/recaptcha.ts`
and `src/lib/email.ts`.

## AI assistant
Provider chain: Cloudflare Workers AI → Google Gemini → OpenAI gpt-4o-mini →
local rule-based answers from the service catalog. The assistant may quote
only the published starting prices in `src/lib/services.ts`; official
quotations require administrator approval. See `src/lib/ai-engine.ts`.

## Deployment
Configure the environment variables in the hosting provider. Add the deployed
site origin to Supabase Auth URL Configuration and add `/auth/callback` to
allowed redirects. Enable email confirmation before public launch.
