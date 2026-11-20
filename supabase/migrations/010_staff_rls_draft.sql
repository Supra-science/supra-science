-- supabase/migrations/010_staff_rls_draft.sql — APPLIED 2026-11-20 (Phase 2,
-- founder approval "المرحلة الثانية"). The "_draft" name is kept so the
-- GitHub snapshot (which has no delete) does not leave a stale copy behind.
--
-- Why it exists: the staff workspace (/staff pages + /api/staff/* routes)
-- used to read through the service_role client, which bypasses RLS — so
-- the app worked without this migration. Phase 2 converts those reads
-- (and the staff status updates) to the user's own session, so these
-- policies are now the SECOND layer AND the live enforcement: a staff
-- session can only see the operational tables, and nothing else.
--
-- CORRECTIONS vs the original draft (found by checking the live DB
-- before applying — the draft as written could NOT have been applied):
--   1. "bookings" does not exist — the real table is consultation_bookings
--      (the staff bookings page read the wrong name too; fixed in the
--      same change to from("consultation_bookings")).
--   2. Admins had NO policy at all on projects / quotations / customers /
--      consultations, so a session-based read by an admin inside /staff
--      would have returned 0 rows. Added "Admins can manage ..." ALL
--      policies on those 4 tables, same pattern as 009. Admin writes in
--      the app still go through service_role; these policies only make
--      session reads/writes possible for admins.
--
-- Scope mirrors the app exactly:
--   READ (staff): projects, quotations, customers, consultations,
--     contact_messages, consultation_bookings — whole tables, read-only.
--   UPDATE (staff): projects.status, consultations.status (+scheduled_at),
--     contact_messages.status — status columns only.
--   NEVER (staff): user_roles, invoices, payments, services, audit_logs,
--     architecture_drafts, notifications, integrations — no policy grants
--     staff anything on these; admins keep is_admin() ALL policies.
--
-- UPDATE scope note: the staff UPDATE policies grant the privilege on the
-- whole row; "status-only" is enforced by the staff API routes (column
-- whitelist in handleAdminStatusUpdate), not by the DB — a WITH CHECK
-- cannot compare OLD vs NEW values. The DB boundary that matters is
-- WHICH tables staff can touch at all.
-- FOLLOW-UP (2026-11-20, migration 012): status-only is now ALSO enforced
-- at the DB layer via column-level UPDATE grants (projects: status;
-- consultations: status + scheduled_at; contact_messages: status).
--
-- SAFETY: this migration ONLY ADDS policies (and one helper function).
-- It changes no data, drops no table/column/row, and does not touch any
-- existing policy. Re-runnable: every policy is dropped first (IF EXISTS).
--
-- To verify after applying: as a staff session, SELECT on invoices must
-- return 0 rows while SELECT on projects works; as an admin session,
-- SELECT on projects must return all rows.

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

-- ---------------------------------------------------------------------------
-- Admin full access (all commands) on the 4 operational tables that had
-- no admin policy at all (same pattern as 009). Without these, an admin
-- reading /staff through their own session would see 0 rows.
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can manage projects" on public.projects;
create policy "Admins can manage projects"
  on public.projects for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage quotations" on public.quotations;
create policy "Admins can manage quotations"
  on public.quotations for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage customers" on public.customers;
create policy "Admins can manage customers"
  on public.customers for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage consultations" on public.consultations;
create policy "Admins can manage consultations"
  on public.consultations for all
  using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- READ: operational tables, staff only (admins already covered above).
-- ---------------------------------------------------------------------------
drop policy if exists "Staff can view projects" on public.projects;
create policy "Staff can view projects"
  on public.projects for select to authenticated using (is_staff());

drop policy if exists "Staff can view quotations" on public.quotations;
create policy "Staff can view quotations"
  on public.quotations for select to authenticated using (is_staff());

drop policy if exists "Staff can view customers" on public.customers;
create policy "Staff can view customers"
  on public.customers for select to authenticated using (is_staff());

drop policy if exists "Staff can view consultations" on public.consultations;
create policy "Staff can view consultations"
  on public.consultations for select to authenticated using (is_staff());

drop policy if exists "Staff can view contact_messages" on public.contact_messages;
create policy "Staff can view contact_messages"
  on public.contact_messages for select to authenticated using (is_staff());

drop policy if exists "Staff can view consultation_bookings" on public.consultation_bookings;
create policy "Staff can view consultation_bookings"
  on public.consultation_bookings for select to authenticated using (is_staff());

-- ---------------------------------------------------------------------------
-- UPDATE: status columns only — enforced by the app layer (staff API
-- routes whitelist the columns); these policies grant the UPDATE
-- privilege itself on the three tables staff may change.
-- ---------------------------------------------------------------------------
drop policy if exists "Staff can update project status" on public.projects;
create policy "Staff can update project status"
  on public.projects for update to authenticated
  using (is_staff()) with check (is_staff());

drop policy if exists "Staff can update consultation status" on public.consultations;
create policy "Staff can update consultation status"
  on public.consultations for update to authenticated
  using (is_staff()) with check (is_staff());

drop policy if exists "Staff can update contact message status" on public.contact_messages;
create policy "Staff can update contact message status"
  on public.contact_messages for update to authenticated
  using (is_staff()) with check (is_staff());
