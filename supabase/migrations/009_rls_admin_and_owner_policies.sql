-- 009_rls_admin_and_owner_policies.sql
-- Supra-Science — RLS policies for the 8 tables that had none (audit finding #3, 2026-11-13).
--
-- Applied to production (project "Supra-science", ref ityzbuncztwgtxudcobr) at
-- Dr. Faisal's explicit instruction to fix finding #3 (2026-11-13).
--
-- SAFETY: this migration ONLY ADDS policies. It changes no data, drops no
-- table/column/row, and does not touch any existing policy. All current app
-- access goes through the service_role key, which bypasses RLS, so every
-- existing flow keeps working exactly as before.
--
-- New access granted (only via a signed-in user's own JWT, never anon):
--   - admins (user_roles.role = 'admin') get full access on the 8 tables
--     (audit_logs: read-only, the log stays append-only);
--   - owners get access to their own ai_conversations / ai_messages, and
--     read access to their own invoices (same pattern as the existing
--     "Users can view own quotations" policy).
--
-- Re-runnable: every policy is dropped first (IF EXISTS).

-- Admin check (SECURITY DEFINER: reads user_roles regardless of the
-- caller's own policies). Returns false for anon (auth.uid() is NULL).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------------
-- Admin full access (all commands) on the 8 tables.
-- ---------------------------------------------------------------------------
drop policy if exists "Admins can manage ai_conversations" on public.ai_conversations;
create policy "Admins can manage ai_conversations"
  on public.ai_conversations for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage ai_messages" on public.ai_messages;
create policy "Admins can manage ai_messages"
  on public.ai_messages for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage consultation_bookings" on public.consultation_bookings;
create policy "Admins can manage consultation_bookings"
  on public.consultation_bookings for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage contact_messages" on public.contact_messages;
create policy "Admins can manage contact_messages"
  on public.contact_messages for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage invoices" on public.invoices;
create policy "Admins can manage invoices"
  on public.invoices for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage whatsapp_conversations" on public.whatsapp_conversations;
create policy "Admins can manage whatsapp_conversations"
  on public.whatsapp_conversations for all
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can manage whatsapp_messages" on public.whatsapp_messages;
create policy "Admins can manage whatsapp_messages"
  on public.whatsapp_messages for all
  using (public.is_admin()) with check (public.is_admin());

-- Audit log stays append-only even for admins: read-only.
drop policy if exists "Admins can view audit_logs" on public.audit_logs;
create policy "Admins can view audit_logs"
  on public.audit_logs for select
  using (public.is_admin());

-- ---------------------------------------------------------------------------
-- Owner access.
-- ---------------------------------------------------------------------------
drop policy if exists "Users can manage own ai_conversations" on public.ai_conversations;
create policy "Users can manage own ai_conversations"
  on public.ai_conversations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can manage messages of own ai_conversations" on public.ai_messages;
create policy "Users can manage messages of own ai_conversations"
  on public.ai_messages for all
  using (exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.ai_conversations c
    where c.id = ai_messages.conversation_id and c.user_id = auth.uid()
  ));

drop policy if exists "Users can view own invoices" on public.invoices;
create policy "Users can view own invoices"
  on public.invoices for select
  using (customer_id in (
    select customers.id from public.customers
    where customers.user_id = auth.uid()
  ));
