-- 015_audit_fixes_draft.sql — DRAFT ONLY, NOT APPLIED.
-- Fixes audit findings L1 + L2 + L3 from the full Supabase audit 2026-11-20.
-- DO NOT APPLY without the founder's explicit approval (production DDL).
-- Apply order matters: indexes first (safe, concurrent-safe only if run
-- outside a transaction with CONCURRENTLY — as written here they run in one
-- transaction, fine for tiny tables), then the FK re-definitions, then the
-- payments CHECK change. Rollback: drop the 13 indexes; re-add the two FKs
-- without ON DELETE; restore 'stripe_test' in the payments CHECK.
-- No data is deleted or modified by this migration. payments has 0 rows,
-- so the CHECK change cannot reject existing data.

-- L1: indexes on 13 foreign-key columns that had no dedicated index.
-- (All affected tables are empty or tiny today; this is future-proofing.)
CREATE INDEX IF NOT EXISTS consultations_customer_id_idx ON public.consultations (customer_id);
CREATE INDEX IF NOT EXISTS consultations_project_id_idx ON public.consultations (project_id);
CREATE INDEX IF NOT EXISTS quotations_customer_id_idx ON public.quotations (customer_id);
CREATE INDEX IF NOT EXISTS payments_quotation_id_idx ON public.payments (quotation_id);
CREATE INDEX IF NOT EXISTS payments_recorded_by_idx ON public.payments (recorded_by);
CREATE INDEX IF NOT EXISTS project_files_project_id_idx ON public.project_files (project_id);
CREATE INDEX IF NOT EXISTS project_files_uploaded_by_idx ON public.project_files (uploaded_by);
CREATE INDEX IF NOT EXISTS audit_logs_actor_id_idx ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS architecture_drafts_project_id_idx ON public.architecture_drafts (project_id);
CREATE INDEX IF NOT EXISTS whatsapp_conversations_customer_id_idx ON public.whatsapp_conversations (customer_id);
CREATE INDEX IF NOT EXISTS invoices_quotation_id_idx ON public.invoices (quotation_id);
CREATE INDEX IF NOT EXISTS invoices_created_by_idx ON public.invoices (created_by);
CREATE INDEX IF NOT EXISTS role_permissions_permission_key_idx ON public.role_permissions (permission_key);

-- L2: declare ON DELETE SET NULL on the two FKs that had no action, so a
-- user deletion keeps history rows instead of failing at the DB level.
-- Both columns are nullable (verified 2026-11-20), so SET NULL is valid.
-- (The admin DELETE route already 409-blocks users with audit/file rows;
-- this only makes the behaviour explicit at the DB level.)
ALTER TABLE public.project_files
  DROP CONSTRAINT project_files_uploaded_by_fkey,
  ADD CONSTRAINT project_files_uploaded_by_fkey
    FOREIGN KEY (uploaded_by) REFERENCES auth.users (id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs
  DROP CONSTRAINT audit_logs_actor_id_fkey,
  ADD CONSTRAINT audit_logs_actor_id_fkey
    FOREIGN KEY (actor_id) REFERENCES auth.users (id) ON DELETE SET NULL;

-- L3: drop 'stripe_test' from the payments method CHECK (Stripe was removed
-- by the founder's decision; the stale value must not be recordable).
ALTER TABLE public.payments
  DROP CONSTRAINT payments_method_check,
  ADD CONSTRAINT payments_method_check
    CHECK (method = ANY (ARRAY['bank_transfer'::text, 'cash'::text, 'other'::text]));
