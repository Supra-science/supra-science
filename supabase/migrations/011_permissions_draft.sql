-- supabase/migrations/011_permissions_draft.sql — APPLIED 2026-11-20
-- (founder order "اكمل سياسة التحديث والترحيل"). The "_draft" name is
-- kept so the GitHub snapshot (which has no delete) does not leave a
-- stale copy behind.
--
-- The permission catalog as database tables, mirroring
-- src/lib/permissions.ts EXACTLY. Applying this migration changes NO
-- runtime behaviour: enforcement still reads the code catalog
-- (permissions.ts). These tables are the database mirror of the catalog
-- (and the seed a future database-driven check would read from); the
-- matrix test (tests/permissions-matrix.test.mjs) asserts the code
-- catalog and this seed can never drift apart.
--
-- Contents:
--   1. permissions        — the catalog (27 atomic permissions)
--   2. role_permissions   — which role holds which permission
--   3. RLS: anyone authenticated may READ the catalog; only
--      service_role may WRITE it (permission changes go through a
--      migration, never through the app).
--   4. Admin auto-grant trigger: every permission that ever enters the
--      catalog is automatically granted to admin, so the database can
--      never drift into a state where an admin lacks a permission.
--      (Mirrors the admin wildcard in roleHasPermission().)
--
-- Verification after applying (run in the SQL editor):
--   SELECT role, count(*) FROM public.role_permissions GROUP BY role;
--     -- expect: admin 27, staff 10, customer 0
--   SELECT count(*) FROM public.permissions; -- expect 27

-- ---------------------------------------------------------------------------
-- 1. The catalog
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissions (
  key text PRIMARY KEY,
  description text NOT NULL
);

-- ---------------------------------------------------------------------------
-- 2. Role -> permission mapping
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.role_permissions (
  role text NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  permission_key text NOT NULL REFERENCES public.permissions (key) ON DELETE CASCADE,
  PRIMARY KEY (role, permission_key)
);

-- ---------------------------------------------------------------------------
-- 3. RLS: read-only for authenticated users, writes service_role only
-- ---------------------------------------------------------------------------
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated read permissions" ON public.permissions;
CREATE POLICY "authenticated read permissions" ON public.permissions
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "authenticated read role_permissions" ON public.role_permissions;
CREATE POLICY "authenticated read role_permissions" ON public.role_permissions
  FOR SELECT TO authenticated USING (true);
-- No INSERT / UPDATE / DELETE policies: only service_role can write.

-- ---------------------------------------------------------------------------
-- 4. Seed the catalog — IDENTICAL to PERMISSIONS in src/lib/permissions.ts
-- ---------------------------------------------------------------------------
INSERT INTO public.permissions (key, description) VALUES
  ('admin:access', 'Enter the admin area (/admin and /api/admin/*)'),
  ('staff:access', 'Enter the staff workspace (/staff and /api/staff/*)'),
  ('projects:read', 'View projects'),
  ('projects:status', 'Change project status'),
  ('quotations:read', 'View quotations'),
  ('quotations:status', 'Change quotation status'),
  ('consultations:read', 'View consultations'),
  ('consultations:status', 'Change consultation status and schedule'),
  ('bookings:read', 'View bookings'),
  ('bookings:status', 'Change booking status'),
  ('customers:read', 'View customers'),
  ('messages:read', 'View contact messages'),
  ('messages:status', 'Change contact-message status'),
  ('invoices:read', 'View invoices'),
  ('invoices:manage', 'Create and update invoices'),
  ('payments:read', 'View payments'),
  ('payments:manage', 'Record payments'),
  ('services:read', 'View services'),
  ('services:manage', 'Create, update and delete services'),
  ('users:manage', 'Change user roles'),
  ('users:delete', 'Permanently remove users'),
  ('notifications:read', 'View notifications'),
  ('notifications:status', 'Change notification status'),
  ('drafts:manage', 'Manage architecture drafts'),
  ('integrations:manage', 'Manage integrations'),
  ('whatsapp:manage', 'Manage WhatsApp settings'),
  ('audit:read', 'View the audit log')
ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- 5. Seed the role rows — IDENTICAL to ROLE_PERMISSIONS in
--    src/lib/permissions.ts. Admin rows are NOT seeded by hand: the
--    trigger in section 6 grants them automatically (and section 7
--    backfills the ones already here).
-- ---------------------------------------------------------------------------
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('staff', 'staff:access'),
  ('staff', 'projects:read'),
  ('staff', 'projects:status'),
  ('staff', 'quotations:read'),
  ('staff', 'customers:read'),
  ('staff', 'consultations:read'),
  ('staff', 'consultations:status'),
  ('staff', 'bookings:read'),
  ('staff', 'messages:read'),
  ('staff', 'messages:status')
ON CONFLICT DO NOTHING;
-- customer holds no permissions in this catalog (the customer dashboard
-- is gated by role, not by these permissions), so no customer rows.

-- ---------------------------------------------------------------------------
-- 6. Admin auto-grant trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_permission_to_admin()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.role_permissions (role, permission_key)
  VALUES ('admin', NEW.key)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS permissions_grant_admin ON public.permissions;
CREATE TRIGGER permissions_grant_admin
AFTER INSERT ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.grant_permission_to_admin();

-- ---------------------------------------------------------------------------
-- 7. Backfill: grant admin every permission already in the catalog
--    (the trigger only fires on future inserts)
-- ---------------------------------------------------------------------------
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin', key FROM public.permissions
ON CONFLICT DO NOTHING;
