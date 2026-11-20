// src/lib/staff-page.ts — page guard for the /staff workspace.
// Added 2026-11-20 (staff permissions build). Page-side counterpart of
// src/lib/staff-auth.ts: instead of returning a 401/403 JSON response it
// redirects — /login when signed out, /dashboard when signed in but
// neither staff nor admin. Used at the top of every staff page and in
// the staff layout, mirroring src/lib/admin-page.ts.

import type { SupabaseClient, User } from "@supabase/supabase-js";
import { requirePermissionPage } from "@/lib/permission-check";
import type { PermissionKey } from "@/lib/permissions";

export { getServiceSupabase } from "@/lib/admin-page";

/**
 * Page guard for staff Server Components. Redirects to /login when there
 * is no session and to /dashboard when the user is not staff/admin.
 * Returns the signed-in user plus the cookie-based Supabase client.
 *
 * Permissions rebuild (2026-11-20): the area check is now the permission
 * `staff:access`, and each staff page passes the specific permission it
 * needs. No MFA gate here, as before — the admin MFA rule applies to
 * admin areas only.
 */
export async function requireStaffPage(
  permission: PermissionKey = "staff:access",
): Promise<{ user: User; supabase: SupabaseClient }> {
  return requirePermissionPage(permission);
}
