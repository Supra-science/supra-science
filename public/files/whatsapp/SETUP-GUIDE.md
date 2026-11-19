# WhatsApp Business Cloud API — Setup Guide

Supra-Science — WhatsApp Business number **+1 (917) 818-3426**.

> **Never paste any token in chat, email, or code.** All four values below go
> into Cloudflare as Worker secrets only (Workers → `supra-science` →
> Settings → Variables → Add variable → Save → Deploy).

## The four secrets

| Secret | Value / where it comes from |
|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | `1314605461746624` (already fetched from WhatsApp Manager, 2026-11-13 — this one is an identifier, not a secret) |
| `WHATSAPP_ACCESS_TOKEN` | Permanent **System User** token from Meta Business Settings (see below). Temporary tokens from the developer dashboard expire in 24 hours — do not use them in production. |
| `WHATSAPP_VERIFY_TOKEN` | A value **you invent** (a long random string). It must match exactly what you enter in Meta's webhook subscription. |
| `WHATSAPP_APP_SECRET` | Meta app secret: developers.facebook.com → the WhatsApp app → Settings → Basic → App Secret → Show (needs your Meta password / 2FA). Used to verify webhook signatures (`X-Hub-Signature-256`). |

## Step 1 — Permanent access token

1. Open `business.facebook.com` → Business Settings → Users → System Users.
2. Add a System User named `Supra-Science` (or use an existing one).
3. Assign assets: select the WhatsApp Business Account `Supra-science` and grant `whatsapp_business_messaging`.
4. Generate Token → choose the WhatsApp app → tick `whatsapp_business_messaging` → copy the token **immediately** (shown once).

## Step 2 — Webhook subscription (Meta)

1. developers.facebook.com → the WhatsApp app → WhatsApp → Configuration → Webhook → Edit.
2. Callback URL: `https://suprascience.dpdns.org/api/whatsapp/webhook`
3. Verify token: the same `WHATSAPP_VERIFY_TOKEN` value you put in Cloudflare.
4. Verify and save, then subscribe to the `messages` webhook field (incoming messages and delivery statuses).

## Step 3 — Add the four secrets in Cloudflare

Workers & Pages → `supra-science` → Settings → Variables → Add variable
(name + value) → Save for each of the four → **Deploy**.

## Step 4 — Verify

1. Open the admin Integrations page — WhatsApp should show **Connected (2/3)**.
2. Send a test WhatsApp message to +1 (917) 818-3426 and confirm it appears in
   Admin → WhatsApp conversations.
3. From Admin → WhatsApp, send a test reply with a verified test recipient
   (dry-run is ON by default — real sending needs an explicit opt-in per call).

## Test-mode guarantees

- No real customer messages are sent without your test and approval.
- Inbound messages are stored (Supabase `whatsapp_conversations` /
  `whatsapp_messages`); the webhook never auto-replies.
- Webhook POSTs without a valid signature are rejected (401); verification
  without the matching verify token is refused (403).
