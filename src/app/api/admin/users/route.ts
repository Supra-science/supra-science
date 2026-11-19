// src/app/api/admin/users/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 9814 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_1e8w9uuebtrcb._.js`.
// PATCH { user_id, role } — admin only. Role must be admin / staff /
// customer. Two guards: an admin cannot change their own role (403), and
// the last remaining administrator cannot be demoted (403 — counted with
// an exact head-count query). The role is upserted into user_roles on
// user_id and the change is audited as `update:user_roles` with
// { from, to }.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, logAudit } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "staff", "customer"];

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = String(body.user_id ?? "");
    const role = String(body.role ?? "");
    if (!userId) return NextResponse.json({ ok: false, error: "user_id is required" }, { status: 400 });
    if (!ROLES.includes(role)) return NextResponse.json({ ok: false, error: "invalid role" }, { status: 400 });
    if (userId === auth.user.id) {
      return NextResponse.json({ ok: false, error: "You cannot change your own role" }, { status: 403 });
    }

    const admin = serviceSupabase();
    const { data: current, error: fetchError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchError) throw fetchError;

    if (current?.role === "admin" && role !== "admin") {
      const { count } = await admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) {
        return NextResponse.json({ ok: false, error: "Cannot remove the last administrator" }, { status: 403 });
      }
    }

    const { data, error } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;

    await logAudit(admin, auth.user.id, "update:user_roles", "user_role", userId, {
      from: current?.role ?? null,
      to: role,
    });
    return NextResponse.json({ ok: true, row: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
