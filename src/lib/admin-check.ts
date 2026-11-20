// src/lib/admin-check.ts — single source of truth for admin identity.
// Added 2026-11-13 (audit finding #7 follow-up): ADMIN_EMAILS was duplicated
// in admin-auth.ts and admin-page.ts — one copy here, used by both, plus the
// central middleware guard. Edge-safe (types only from @supabase/supabase-js).
import type { SupabaseClient, User } from "@supabase/supabase-js";

/** Official admin identity — matches the admin dashboard page. */
export const ADMIN_EMAILS = ["Supra-science@proton.me"];

/** True when the user is the allowlisted admin email or holds the admin role. */
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
  return data?.role === "admin";
}
