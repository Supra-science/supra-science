-- supabase/migrations/013_owner_role_and_suspend.sql — APPLIED 2026-11-20
-- (founder order "انتقل الثالثة" = Phase 3 of the permissions rebuild).
--
-- 1. OWNER ROLE IN THE DATABASE. The platform owner is no longer an
--    email in code (ADMIN_EMAILS): it is a role in user_roles. The owner
--    is a superset of the admin — owner holds every permission including
--    the owner-only ones; the admin holds every permission EXCEPT the
--    owner-only ones (see the OWNER_ONLY set in src/lib/permissions.ts).
--    Only the owner may: delete or suspend another admin, transfer
--    ownership, manage integrations/secrets.
-- 2. SUSPENSION, distinct from deletion. `suspended_at` on user_roles:
--    a suspended account is blocked immediately but the action is fully
--    reversible; permanent deletion stays for clean cases only (no
--    business records — the /api/admin/users DELETE guards).
--
-- Enforcement of suspension has three layers, all in this migration or
-- in code: (a) is_admin()/is_staff() return false while suspended, so
-- RLS denies the staff/admin policies at the database layer; (b) the
-- code hasPermission() denies every permission while suspended, so all
-- guards, middleware and the dashboard refuse the user; (c) the suspend
-- API also sets an Auth ban (ban_duration) so the user cannot sign in
-- again and token refresh fails — the existing JWT dies within an hour
-- at most.
--
-- SAFETY: no data deleted. One role value changes (the Proton admin
-- admin -> owner). The two new permissions are seeded; the auto-grant
-- trigger is rewritten so owner-only keys go to the owner only.
-- Re-runnable (all statements idempotent).

-- --- 1. user_roles: owner role + suspension timestamp -------------------
ALTER TABLE public.user_roles
  DROP CONSTRAINT user_roles_role_check;
ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role = ANY (ARRAY['customer'::text, 'staff'::text, 'admin'::text, 'owner'::text]));
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz;

-- --- 2. Role helpers: owner is an admin superset; suspension voids all --
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'owner')
      AND suspended_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'staff'
      AND suspended_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'owner'
      AND suspended_at IS NULL
  );
$$;

-- --- 3. role_permissions: owner role --------------------------------------
ALTER TABLE public.role_permissions
  DROP CONSTRAINT role_permissions_role_check;
ALTER TABLE public.role_permissions
  ADD CONSTRAINT role_permissions_role_check
  CHECK (role = ANY (ARRAY['admin'::text, 'staff'::text, 'customer'::text, 'owner'::text]));

-- --- 4. Auto-grant trigger FIRST: owner-only keys go to the owner only --
-- (The trigger must be rewritten BEFORE the new permissions are inserted
-- below, or the old trigger grants owner:access to the admin too.)
CREATE OR REPLACE FUNCTION public.grant_permission_to_admin()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.key NOT IN ('integrations:manage', 'owner:access') THEN
    INSERT INTO public.role_permissions (role, permission_key)
    VALUES ('admin', NEW.key)
    ON CONFLICT DO NOTHING;
  END IF;
  INSERT INTO public.role_permissions (role, permission_key)
  VALUES ('owner', NEW.key)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

-- --- 5. New permissions ---------------------------------------------------
-- owner:access — owner-only. users:suspend — admin may suspend
-- staff/customers; suspending an admin still needs owner:access.
INSERT INTO public.permissions (key, description) VALUES
  ('owner:access', 'Owner-only actions: transfer ownership, delete or suspend an admin, manage integrations')
ON CONFLICT (key) DO NOTHING;
INSERT INTO public.permissions (key, description) VALUES
  ('users:suspend', 'Suspend or unsuspend a user account')
ON CONFLICT (key) DO NOTHING;

-- --- 6. Backfill: owner holds everything; admin loses the owner-only keys
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'owner', key FROM public.permissions
ON CONFLICT DO NOTHING;
DELETE FROM public.role_permissions
WHERE role = 'admin' AND permission_key IN ('integrations:manage', 'owner:access');

-- --- 7. The platform owner becomes role 'owner' ---------------------------
-- supra-science@proton.me (d4ed169a-4cf9-4c84-b250-0d7d33ff65dc): the
-- founder. His admin access is unchanged (owner is a superset); the
-- ADMIN_EMAILS code allowlist stays as a fallback only.
UPDATE public.user_roles SET role = 'owner'
WHERE user_id = 'd4ed169a-4cf9-4c84-b250-0d7d33ff65dc' AND role = 'admin';
