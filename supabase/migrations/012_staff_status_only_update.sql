-- supabase/migrations/012_staff_status_only_update.sql — APPLIED 2026-11-20
-- (founder order "اكمل سياسة التحديث والترحيل"). Completes the Phase 2
-- update policy: migration 010 decided WHO may update (RLS policies);
-- this migration decides WHICH COLUMNS a session may update (column
-- grants). Together they make "status-only" true at the database layer,
-- not just in the API code.
--
--   projects:         status only
--   consultations:    status + scheduled_at (the staff route sets both)
--   contact_messages: status only
--
-- Why column grants instead of a trigger: declarative, no code, no new
-- failure mode. A trigger would need an admin exemption and special
-- handling for the set_projects_updated_at trigger (which writes
-- updated_at on every projects UPDATE — trigger-assigned columns are
-- NOT part of the statement's SET list, so they are not blocked by the
-- column grant; verified by the impersonation test below).
--
-- Scope notes:
--   - Admins via session are bound by the same columns. That is fine:
--     admin writes in the app go through service_role (bypasses grants
--     and RLS), and the only session UPDATEs are the staff routes, which
--     send status (+scheduled_at) only by design.
--   - `anon` grants are deliberately untouched: anon is already blocked
--     by RLS on these tables (no policy passes with a NULL uid), and
--     anon UPDATE grants are the Supabase default on every table.
--   - INSERT / DELETE / SELECT grants are untouched — this migration is
--     about UPDATE columns only. RLS remains the gate for those.
--
-- SAFETY: grants only, no data changes, no tables/columns/policies
-- touched. Re-runnable (REVOKE/GRANT are idempotent).
--
-- Verification (impersonation test, temp rows, full cleanup — same
-- pattern as the 010 test): as a staff session, UPDATE projects SET
-- status works (with RETURNING *), UPDATE projects SET title fails with
-- "permission denied for column"; UPDATE consultations SET scheduled_at
-- works; UPDATE contact_messages SET status works; UPDATE invoices still
-- affects 0 rows (RLS). As an admin session, same column rules apply.

REVOKE UPDATE ON public.projects FROM authenticated;
GRANT UPDATE (status) ON public.projects TO authenticated;

REVOKE UPDATE ON public.consultations FROM authenticated;
GRANT UPDATE (status, scheduled_at) ON public.consultations TO authenticated;

REVOKE UPDATE ON public.contact_messages FROM authenticated;
GRANT UPDATE (status) ON public.contact_messages TO authenticated;
