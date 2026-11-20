// src/app/api/admin/users/suspend/route.ts — NEW 2026-11-20 (Phase 3).
// POST { user_id, reason? } — suspend a user account. Suspension is the
// reversible alternative to deletion ("الإخراج" vs "الإزالة"): the account
// is blocked immediately but nothing is deleted and the action can be
// undone with POST /api/admin/users/unsuspend.
//
// Guards (in order):
// 1. An admin cannot suspend their own account (403).
// 2. The platform owner (role `owner`) can never be suspended (403).
// 3. Suspending another ADMIN needs the owner (403 for a plain admin —
//    checked with `owner:access`); suspending a staff member or customer
//    stays an admin action (`users:suspend`).
// 4. An already-suspended account cannot be suspended again (409).
//
// Effects: user_roles.suspended_at is set (the record), an Auth ban is
// placed (ban_duration 10y — the user cannot sign in again and token
// refresh fails; the existing JWT dies within an hour at most), and the
// action is audited as `suspend:user` with { role, reason }.
// Suspension is enforced in three layers: the Auth ban, hasPermission()
// (denies every permission while suspended), and is_admin()/is_staff()/
// is_owner() (return false while suspended, so RLS denies them too).

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
    const reason = typeof body.reason === "string" ? body.reason.slice(0, 200) : null;
    if (!userId) return NextResponse.json({ ok: false, error: "user_id is required" }, { status: 400 });
    if (userId === auth.user.id) {
      return NextResponse.json({ ok: false, error: "You cannot suspend your own account" }, { status: 403 });
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

    if (role === "owner") {
      return NextResponse.json({ ok: false, error: "Cannot suspend the platform owner account" }, { status: 403 });
    }
    if (role === "admin" && !(await hasPermission(auth.supabase, auth.user, "owner:access"))) {
      return NextResponse.json({ ok: false, error: "Only the platform owner can suspend an administrator" }, { status: 403 });
    }
    if (current?.suspended_at) {
      return NextResponse.json({ ok: false, error: "User is already suspended" }, { status: 409 });
    }

    const suspendedAt = new Date().toISOString();
    const { error: upsertError } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role, suspended_at: suspendedAt }, { onConflict: "user_id" });
    if (upsertError) throw upsertError;

    const { error: banError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: "87600h",
    });
    if (banError) throw banError;

    await logAudit(admin, auth.user.id, "suspend:user", "user", userId, { role, reason });
    return NextResponse.json({ ok: true, suspended_at: suspendedAt });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
