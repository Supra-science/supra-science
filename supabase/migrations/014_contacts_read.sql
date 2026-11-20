-- supabase/migrations/014_contacts_read.sql — DRAFT, NOT APPLIED
-- (founder order 2026-11-20: the platform owner may view the contact
-- details of every user — customers, staff and admins).
--
-- One new permission, owner-only:
--   contacts:read — view contact details (email, phone, company,
--   country) of any user, shown on /admin/users.
--
-- Why owner-only: the founder asked for the OWNER specifically. The
-- admin keeps seeing customer contact details on /admin/customers (and
-- staff on /staff/customers) exactly as before — this migration changes
-- nothing for them. Only the owner gains the users-page contact view.
--
-- SAFETY: no data deleted, no role changes, no RLS change. One row
-- added to permissions; one row added to role_permissions (owner only);
-- the admin rows for the three owner-only keys are removed (none can
-- exist for the new key yet, but the statement is written to cover all
-- three so a re-run stays correct).
-- Re-runnable (all statements idempotent).
-- DO NOT APPLY without the founder's explicit approval.

-- --- 1. Auto-grant trigger FIRST: owner-only keys go to the owner only --
-- (The trigger must be rewritten BEFORE the new permission is inserted
-- below, or the old trigger grants contacts:read to the admin too.)
CREATE OR REPLACE FUNCTION public.grant_permission_to_admin()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.key NOT IN ('integrations:manage', 'owner:access', 'contacts:read') THEN
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

-- --- 2. New permission ----------------------------------------------------
-- contacts:read — owner-only.
INSERT INTO public.permissions (key, description) VALUES
  ('contacts:read', 'View contact details (email, phone, company, country) of any user')
ON CONFLICT (key) DO NOTHING;

-- --- 3. Backfill: owner holds it; admin holds none of the owner-only keys
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'owner', key FROM public.permissions
WHERE key = 'contacts:read'
ON CONFLICT DO NOTHING;
DELETE FROM public.role_permissions
WHERE role = 'admin' AND permission_key IN ('integrations:manage', 'owner:access', 'contacts:read');
