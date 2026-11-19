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
  if (user.email && ADMIN_EMAILS.includes(user.email)) return true;
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();
  return data?.role === "admin";
}
