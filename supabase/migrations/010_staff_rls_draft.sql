-- supabase/migrations/010_staff_rls_draft.sql — DRAFT ONLY, NOT APPLIED.
-- Added 2026-11-20 (staff permissions build). This file is a proposal for
-- the founder's explicit approval before ANY production DDL (production
-- rule: no migration on Supabase without his explicit approval).
--
-- Why it exists: the staff workspace (/staff pages + /api/staff/* routes)
-- reads through the service_role client, which bypasses RLS — so the app
-- works without this migration. These policies are the SECOND layer: they
-- let a staff session read the operational tables directly (e.g. from
-- future staff tooling or the SQL editor) with the same boundaries the
-- app enforces, and they make the role meaningful at the database level.
--
-- Scope mirrors the app exactly:
--   READ (staff): projects, quotations, customers, consultations,
--     contact_messages, bookings — whole tables, read-only.
--   UPDATE (staff): projects.status, consultations.status (+scheduled_at),
--     contact_messages.status — status columns only.
--   NEVER (staff): user_roles, invoices, payments, services, audit_logs,
--     architecture_drafts, notifications, integrations — no policy grants
--     staff anything on these; admins keep is_admin() ALL policies.
--
-- To apply (only after his approval): run via sb_apply.py against
-- project ityzbuncztwgtxudcobr, then verify with a staff session that
-- SELECT on invoices returns 0 rows while SELECT on projects works.

create or replace function public.is_staff()
returns boolean
language sql
stable security definer
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'staff'
  );
$$;

-- READ: operational tables, staff only (admins already covered by is_admin()).
create policy "Staff can view projects"
  on public.projects for select to authenticated using (is_staff());
create policy "Staff can view quotations"
  on public.quotations for select to authenticated using (is_staff());
create policy "Staff can view customers"
  on public.customers for select to authenticated using (is_staff());
create policy "Staff can view consultations"
  on public.consultations for select to authenticated using (is_staff());
create policy "Staff can view contact_messages"
  on public.contact_messages for select to authenticated using (is_staff());
create policy "Staff can view bookings"
  on public.bookings for select to authenticated using (is_staff());

-- UPDATE: status columns only — enforced by a WITH CHECK that the row
-- keeps every other column unchanged is not expressible in a single
-- policy, so the app layer (staff API routes) remains the real guard
-- for "status-only"; these policies grant the UPDATE privilege itself.
create policy "Staff can update project status"
  on public.projects for update to authenticated
  using (is_staff()) with check (is_staff());
create policy "Staff can update consultation status"
  on public.consultations for update to authenticated
  using (is_staff()) with check (is_staff());
create policy "Staff can update contact message status"
  on public.contact_messages for update to authenticated
  using (is_staff()) with check (is_staff());
