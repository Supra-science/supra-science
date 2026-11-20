// src/lib/permission-check.ts — permission guards for API routes and
// pages (Phase 1 of the permissions rebuild, 2026-11-20).
//
// These are the guards routes and pages call. The role-specific
// wrappers (requireAdmin / requireStaff / requireAdminPage /
// requireStaffPage) delegate here with their area permission — they add
// their own rules on top (notably the admin MFA gate, which lives in
// admin-auth.ts / admin-page.ts and is NOT part of the permission
// check itself: staff areas never had an MFA gate and still don't).
//
// Shapes mirror the guards they replace so call sites keep working:
// - requirePermission() returns { user, supabase } or { error: 401/403 }.
// - requirePermissionPage() returns { user, supabase } or redirects
//   (/login when signed out, /dashboard when the permission is missing).

import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { hasPermission } from "@/lib/permissions";
import type { PermissionKey } from "@/lib/permissions";

/**
 * Result of an API permission guard. A discriminated union with the
 * absent side typed as `never`, so call sites may write the natural
 * `if (auth.error) return auth.error;` / `auth.user.id` pattern and
 * TypeScript narrows correctly on both branches.
 */
export type PermissionGuardResult =
  | { user: User; supabase: SupabaseClient; error?: never }
  | { error: NextResponse; user?: never; supabase?: never };

/** Verify the caller holds `permission`. Returns { user, supabase } or { error }. */
export async function requirePermission(
  permission: PermissionKey,
): Promise<PermissionGuardResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) as NextResponse };
  }
  if (!(await hasPermission(supabase, user, permission))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) as NextResponse };
  }
  return { user, supabase };
}

/**
 * Page guard for Server Components. Redirects to /login when there is
 * no session and to /dashboard when the permission is missing. Returns
 * the signed-in user plus the cookie-based Supabase client.
 */
export async function requirePermissionPage(
  permission: PermissionKey,
): Promise<{ user: User; supabase: SupabaseClient }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await hasPermission(supabase, user, permission))) redirect("/dashboard");
  return { user, supabase };
}
