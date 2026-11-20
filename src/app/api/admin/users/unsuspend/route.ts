// src/app/api/admin/users/unsuspend/route.ts — NEW 2026-11-20 (Phase 3).
// POST { user_id } — lift a suspension placed by POST /api/admin/users/suspend.
// Same guards as suspend (an admin cannot unsuspend themself out of a
// suspension they do not have; unsuspending an admin needs the owner).
// Effects: user_roles.suspended_at is cleared and the Auth ban is removed
// (ban_duration "none"), so the user can sign in again immediately.
// Audited as `unsuspend:user`.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, logAudit, errorMessage } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("users:suspend");
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = String(body.user_id ?? "");
    if (!userId) return NextResponse.json({ ok: false, error: "user_id is required" }, { status: 400 });
    if (userId === auth.user.id) {
      return NextResponse.json({ ok: false, error: "You cannot unsuspend your own account" }, { status: 403 });
    }

    const admin = serviceSupabase();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError) throw targetError;
    if (!target.user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });

    const { data: current, error: fetchError } = await admin
      .from("user_roles")
      .select("role, suspended_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    const role = current?.role ?? "customer";

    if (role === "admin" && !(await hasPermission(auth.supabase, auth.user, "owner:access"))) {
      return NextResponse.json({ ok: false, error: "Only the platform owner can unsuspend an administrator" }, { status: 403 });
    }
    if (!current?.suspended_at) {
      return NextResponse.json({ ok: false, error: "User is not suspended" }, { status: 409 });
    }

    const { error: updateError } = await admin
      .from("user_roles")
      .update({ suspended_at: null })
      .eq("user_id", userId);
    if (updateError) throw updateError;

    const { error: unbanError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    });
    if (unbanError) throw unbanError;

    await logAudit(admin, auth.user.id, "unsuspend:user", "user", userId, { role });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
