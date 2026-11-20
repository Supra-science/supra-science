// src/lib/staff-check.ts — single source of truth for staff identity.
// Added 2026-11-20 (staff permissions build): until now the "staff" role
// existed only as a label in user_roles — no code ever checked for it.
// This module mirrors src/lib/admin-check.ts so the two role checks stay
// symmetrical and each has exactly one definition.
//
// Scope rule: staff is an OPERATIONS role, not a junior admin. Staff may
// work the pipeline (projects, consultations, contact messages) and read
// quotations, customers and bookings. Staff may NOT touch users/roles,
// invoices, payments, services, integrations, WhatsApp settings, audit
// logs or drafts — those stay admin-only. Financial amounts are never
// shown on staff pages (no invoices/payments sections).
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** True when the user holds the staff role in user_roles. */
export async function isStaffUser(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role === "staff";
}

/**
 * True when the user is staff OR admin. Admin is a superset of staff:
 * an admin may use the staff workspace too. Use this (never isStaffUser
 * alone) for every staff-area guard so admins are not locked out of
 * the staff workspace.
 */
export async function isStaffOrAdminUser(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role === "staff" || data?.role === "admin";
}
