// src/lib/staff-auth.ts — API guard for /api/staff/* routes.
// Added 2026-11-20 (staff permissions build). Mirrors src/lib/admin-auth.ts
// but allows staff OR admin. Differences from requireAdmin, deliberate:
// - No MFA gate: the AAL2 requirement (audit finding #6) applies to
//   admins only; staff sessions are accepted at AAL1.
// - The audit helpers (logAudit, errorMessage, serviceSupabase) are
//   reused from admin-auth — one copy, no duplication.

import { requirePermission } from "@/lib/permission-check";
import type { PermissionGuardResult } from "@/lib/permission-check";
import type { PermissionKey } from "@/lib/permissions";

export { logAudit, errorMessage, serviceSupabase } from "@/lib/admin-auth";

/** Verify the caller is staff or admin. Returns { user } or { error: NextResponse }. */
export async function requireStaff(
  permission: PermissionKey = "staff:access",
): Promise<PermissionGuardResult> {
  return requirePermission(permission);
}
