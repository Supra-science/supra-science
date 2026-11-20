// src/app/api/admin/users/transfer-owner/route.ts — NEW 2026-11-20 (Phase 3).
// POST { user_id } — move platform ownership from the caller to another
// administrator. There is exactly one owner: the target becomes `owner`
// and the caller becomes `admin` in the same request. The action is
// audited as `transfer:owner` with { from, to }.
//
// Guards (in order):
// 1. Only the owner may transfer ownership (permission `owner:access`).
// 2. The caller cannot transfer ownership to themself (403).
// 3. The target must be an administrator (403 otherwise — ownership
//    never goes to a staff member or a customer directly; promote first).
// 4. A suspended administrator cannot receive ownership (403).
//
// Reversal: the new owner transfers it back the same way. If the
// transfer ever needs to be undone outside the app, a direct
// user_roles update (owner -> admin, admin -> owner) restores it.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, logAudit, errorMessage } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin("owner:access");
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = String(body.user_id ?? "");
    if (!userId) return NextResponse.json({ ok: false, error: "user_id is required" }, { status: 400 });
    if (userId === auth.user.id) {
      return NextResponse.json({ ok: false, error: "You are already the platform owner" }, { status: 403 });
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
    if (current?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Ownership can only move to an administrator" }, { status: 403 });
    }
    if (current?.suspended_at) {
      return NextResponse.json({ ok: false, error: "A suspended administrator cannot receive ownership" }, { status: 403 });
    }

    const { error: promoteError } = await admin
      .from("user_roles")
      .update({ role: "owner" })
      .eq("user_id", userId);
    if (promoteError) throw promoteError;

    const { error: demoteError } = await admin
      .from("user_roles")
      .upsert({ user_id: auth.user.id, role: "admin" }, { onConflict: "user_id" });
    if (demoteError) throw demoteError;

    await logAudit(admin, auth.user.id, "transfer:owner", "user", userId, {
      from: auth.user.id,
      to: userId,
    });
    return NextResponse.json({ ok: true, new_owner: userId });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
