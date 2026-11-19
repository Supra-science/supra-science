# Supabase — Setup Guide

Supra-Science — Supabase project **Supra-science**
(ref `ityzbuncztwgtxudcobr`, region `us-east-1`, Postgres 17).

The integration is already **Connected**: the project URL is configured and
the live Worker holds the service-role key as a server secret. This guide is
a reference for checks and for any future change.

## What is already in place

- 19 public tables: `profiles`, `user_roles`, `services`, `customers`,
  `projects`, `consultations`, `consultation_bookings`, `quotations`,
  `invoices`, `payments`, `contact_messages`, `ai_conversations`,
  `ai_messages`, `architecture_drafts`, `audit_logs`, `notifications`,
  `project_files`, `whatsapp_conversations`, `whatsapp_messages`.
- Row Level Security (RLS) is enabled on all 19 tables.
- `services` has **no price column** — prices live only in the site code
  (indicative starting prices) and in quotations.
- Secrets on the Worker (names only, never values): `SUPABASE_SERVICE_ROLE_KEY`
  plus the public `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` variables.

## Rules (production database — real client data may live here)

- **No DDL / migration on production without explicit approval** — including
  any migration numbered 008 or later.
- **Never disable RLS** to work around a problem.
- No demo or test data in production tables; test traces must be removed
  after verification (as was done for the 2026-11-12 contact/booking tests).
- No mass delete or mass update.
- Never paste the service-role key in chat, email, or code.

## If the integration ever shows a problem

1. Check the Supabase dashboard: project status, database health, auth logs.
2. Check the Worker secrets (names only) in Cloudflare — the three Supabase
   values must all be present.
3. Check the admin Integrations page and the audit log (`audit_logs` table).
