// src/lib/permissions.ts — permission catalog, the single source of truth
// for "who may do what" (Phase 1 of the permissions rebuild, 2026-11-20).
//
// Design (deliberate, read before changing):
// - A permission is one atomic capability, named `resource:action`
//   (e.g. `projects:status`). Roles are BUNDLES of permissions — the code
//   never asks "is this user staff?", it asks "may this user do X?" via
//   roleHasPermission() / hasPermission().
// - `admin` is a wildcard: an admin holds EVERY permission in the catalog,
//   including ones added later. Staff and customer hold exactly the rows
//   in ROLE_PERMISSIONS — nothing more. An unknown role or an unknown
//   permission key is always DENIED (fail-closed, even for admins), so a
//   typo in a guard can never silently grant access.
// - This module is the runtime-enforced catalog. The database twin lives
//   in supabase/migrations/011_permissions_draft.sql (DRAFT, not applied)
//   with the identical seed — tests/permissions-matrix.test.mjs asserts
//   the two can never drift apart.
// - Role identity still comes from the existing primitives
//   (isAdminUser / isStaffUser): hasPermission() asks them in order, so
//   the allowlisted owner email keeps working exactly as before. That
//   costs one extra role lookup for non-admins; correctness first — the
//   same request already pays for a role lookup in the page guard.
// - Edge-safe: only `import type` from @supabase/supabase-js plus two
//   value imports from sibling lib modules that themselves import
//   nothing at runtime. Safe to import from middleware.ts.

import type { SupabaseClient, User } from "@supabase/supabase-js";
// NOTE: the two relative imports below carry explicit `.ts` extensions.
// That is deliberate: it lets Node 24 run this module directly (type
// stripping) so tests/permissions-runtime.test.mjs can execute the real
// resolver instead of only parsing its source. TypeScript and Next.js
// both resolve explicit `.ts` extensions.
import { ADMIN_EMAILS, isAdminUser } from "./admin-check.ts";
import { isStaffUser } from "./staff-check.ts";

export type Role = "admin" | "staff" | "customer";

export type PermissionKey =
  | "admin:access"
  | "staff:access"
  | "projects:read"
  | "projects:status"
  | "quotations:read"
  | "quotations:status"
  | "consultations:read"
  | "consultations:status"
  | "bookings:read"
  | "bookings:status"
  | "customers:read"
  | "messages:read"
  | "messages:status"
  | "invoices:read"
  | "invoices:manage"
  | "payments:read"
  | "payments:manage"
  | "services:read"
  | "services:manage"
  | "users:manage"
  | "users:delete"
  | "notifications:read"
  | "notifications:status"
  | "drafts:manage"
  | "integrations:manage"
  | "whatsapp:manage"
  | "audit:read";

/** The full catalog: every permission the code may ask for, with its meaning. */
export const PERMISSIONS: Record<PermissionKey, string> = {
  "admin:access": "Enter the admin area (/admin and /api/admin/*)",
  "staff:access": "Enter the staff workspace (/staff and /api/staff/*)",
  "projects:read": "View projects",
  "projects:status": "Change project status",
  "quotations:read": "View quotations",
  "quotations:status": "Change quotation status",
  "consultations:read": "View consultations",
  "consultations:status": "Change consultation status and schedule",
  "bookings:read": "View bookings",
  "bookings:status": "Change booking status",
  "customers:read": "View customers",
  "messages:read": "View contact messages",
  "messages:status": "Change contact-message status",
  "invoices:read": "View invoices",
  "invoices:manage": "Create and update invoices",
  "payments:read": "View payments",
  "payments:manage": "Record payments",
  "services:read": "View services",
  "services:manage": "Create, update and delete services",
  "users:manage": "Change user roles",
  "users:delete": "Permanently remove users",
  "notifications:read": "View notifications",
  "notifications:status": "Change notification status",
  "drafts:manage": "Manage architecture drafts",
  "integrations:manage": "Manage integrations",
  "whatsapp:manage": "Manage WhatsApp settings",
  "audit:read": "View the audit log",
};

/** Every permission key in the catalog. */
export const ALL_PERMISSIONS: PermissionKey[] = Object.keys(
  PERMISSIONS,
) as PermissionKey[];

/**
 * What each non-admin role holds. Admin is NOT listed here: an admin
 * holds every permission by the wildcard in roleHasPermission(), so a
 * permission added later is automatically an admin permission too.
 * Customer holds nothing in this catalog — the customer dashboard is
 * gated by role, not by these permissions.
 */
export const ROLE_PERMISSIONS: Record<Exclude<Role, "admin">, PermissionKey[]> = {
  staff: [
    "staff:access",
    "projects:read",
    "projects:status",
    "quotations:read",
    "customers:read",
    "consultations:read",
    "consultations:status",
    "bookings:read",
    "messages:read",
    "messages:status",
  ],
  customer: [],
};

/** True when `value` is a key of the catalog. */
export function isPermissionKey(value: string): value is PermissionKey {
  return value in PERMISSIONS;
}

/** The permissions a role holds (admin: the whole catalog). */
export function getRolePermissions(role: Role): PermissionKey[] {
  if (role === "admin") return [...ALL_PERMISSIONS];
  return [...(ROLE_PERMISSIONS[role] ?? [])];
}

/**
 * Pure permission check. Fail-closed: an unknown permission key is
 * denied for EVERYONE (including admins — a typo must never grant
 * access), and an unknown role holds nothing.
 */
export function roleHasPermission(role: string, permission: string): boolean {
  if (!isPermissionKey(permission)) return false;
  if (role === "admin") return true;
  if (role !== "staff" && role !== "customer") return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Resolve a user's effective role from their email and their user_roles
 * row — without a database call. The allowlisted owner email is an
 * admin even with no role row (matched case-insensitively: the stored
 * auth email is lowercase while the allowlist constant is capitalised —
 * a case-sensitive match would silently drop the owner if the role row
 * were ever deleted).
 */
export function resolveEffectiveRole(
  email: string | null | undefined,
  dbRole: string | null | undefined,
): Role {
  if (
    email &&
    ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === email.toLowerCase())
  ) {
    return "admin";
  }
  if (dbRole === "admin" || dbRole === "staff" || dbRole === "customer") return dbRole;
  return "customer";
}

/**
 * The user's effective role, resolved with one database lookup chain
 * through the existing role primitives. Admin first (one lookup for
 * admins), then staff — a customer pays for two lookups, which is the
 * same cost the page guard already pays.
 */
export async function getEffectiveRole(
  supabase: SupabaseClient,
  user: User,
): Promise<Role> {
  if (await isAdminUser(supabase, user)) return "admin";
  if (await isStaffUser(supabase, user)) return "staff";
  return "customer";
}

/** True when the user may exercise `permission`. */
export async function hasPermission(
  supabase: SupabaseClient,
  user: User,
  permission: string,
): Promise<boolean> {
  if (!isPermissionKey(permission)) return false;
  const role = await getEffectiveRole(supabase, user);
  return roleHasPermission(role, permission);
}
