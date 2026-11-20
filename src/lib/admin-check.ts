// src/lib/admin-check.ts — single source of truth for admin identity.
// Added 2026-11-13 (audit finding #7 follow-up): ADMIN_EMAILS was duplicated
// in admin-auth.ts and admin-page.ts — one copy here, used by both, plus the
// central middleware guard. Edge-safe (types only from @supabase/supabase-js).
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Official admin identity — matches the admin dashboard page. */
export const ADMIN_EMAILS = ["Supra-science@proton.me"];

/**
 * True when the user is the platform owner: the allowlisted owner email
 * or the owner role in user_roles. The owner is a superset of the admin,
 * so every admin check below also passes for the owner.
 */
export async function isOwnerUser(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  if (
    user.email &&
    ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === user.email!.toLowerCase())
  ) {
    return true;
  }
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role === "owner";
}

/** True when the user is the allowlisted owner email or holds the admin OR owner role. */
export async function isAdminUser(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  // Case-insensitive allowlist match (hardened 2026-11-20, permissions
  // rebuild): the stored auth email is lowercase
  // ("supra-science@proton.me") while the constant is capitalised — a
  // case-sensitive match would silently drop the owner if the role row
  // were ever deleted. The owner email is an admin either way today
  // (the role row exists), so this changes no live behaviour.
  if (
    user.email &&
    ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === user.email!.toLowerCase())
  ) {
    return true;
  }
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role === "admin" || data?.role === "owner";
}

/**
 * True when the user's account is suspended (suspended_at set). A
 * suspended user holds no permission — hasPermission() checks this
 * first — and the database helpers is_admin()/is_staff()/is_owner()
 * return false for them too, so RLS denies them as well.
 */
export async function isSuspendedUser(
  supabase: SupabaseClient,
  user: User,
): Promise<boolean> {
  const { data } = await supabase
    .from("user_roles")
    .select("suspended_at")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.suspended_at != null;
}
