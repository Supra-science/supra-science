// src/app/api/admin/notifications/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 93107 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_0unhy_vsxd8pl._.js`.
// PATCH { id, is_read } — admin only. Unlike the other admin PATCH routes
// this one does not change a status: it sets notifications.is_read to
// (body.is_read === true) and writes an audit row `update:notifications`.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, logAudit } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    const isRead = body.is_read === true;

    const admin = serviceSupabase();
    const { data, error } = await admin
      .from("notifications")
      .update({ is_read: isRead })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(admin, auth.user.id, "update:notifications", "notification", id, { is_read: isRead });
    return NextResponse.json({ ok: true, row: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
