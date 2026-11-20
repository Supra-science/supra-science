// src/lib/admin-page.ts — RECONSTRUCTED from the Nov-8 2026 live Cloudflare Workers bundle.
// Bundle evidence: module 44119 in chunk
// `.open-next/server-functions/default/.next/server/chunks/ssr/_1w91lpz-x_y1x._.js`
// (same chunk as the admin styles, module 56805).
// Page-side counterpart of src/lib/admin-auth.ts: instead of returning a
// 401/403 JSON response it redirects — /login when signed out, /dashboard
// when signed in but not an admin. Used at the top of every admin page.
// TODO(RECONSTRUCTION-GAP): the bundle chunk carries no "[project]/src/..."
// label for this module, so the original filename is not recoverable from
// the bundle. "admin-page.ts" is a reconstruction-time name; the exports and
// behaviour below are exact.

import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { requirePermissionPage } from "@/lib/permission-check";
import type { PermissionKey } from "@/lib/permissions";

/**
 * Page guard for admin Server Components. Redirects to /login when there is
 * no session and to /dashboard when the user is not an admin. Returns the
 * signed-in user plus the cookie-based Supabase client.
 *
 * Permissions rebuild (2026-11-20): the area check is now the permission
 * `admin:access`, and each admin page passes the specific permission it
 * needs. The MFA gate below is unchanged and applies to every admin page.
 */
export async function requireAdminPage(
  permission: PermissionKey = "admin:access",
): Promise<{ user: User; supabase: SupabaseClient }> {
  const { user, supabase } = await requirePermissionPage(permission);
  // MFA (added 2026-11-13, audit finding #6): an admin with an enrolled
  // TOTP factor must have completed verification (AAL2) — the login page
  // handles the TOTP step right after sign-in.
  if (!(await hasCompletedMfa(supabase))) redirect("/login");
  return { user, supabase };
}

/**
 * True unless the session belongs to a user with an enrolled MFA factor
 * who has not completed verification yet (AAL1 while AAL2 is required).
 * Best-effort: if the AAL check itself fails, the signed-in session is
 * still accepted.
 */
export async function hasCompletedMfa(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") return false;
    return true;
  } catch {
    return true;
  }
}

/**
 * Nullable service_role client for admin pages. Returns null (instead of
 * throwing) when the service credentials are not configured; pages render a
 * "database not configured" notice in that case.
 */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || "https://ityzbuncztwgtxudcobr.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createAdminClient(url, key) : null;
}
