// src/lib/admin-update.ts — RECONSTRUCTED from the Nov-8 2026 live Cloudflare Workers bundle.
// Bundle evidence: module 12328 in chunk
// `.open-next/server-functions/default/.next/server/chunks/[root-of-the-server]__0-fc7x95fne0k._.js`.
// Generic PATCH handler shared by the consultations, drafts, messages,
// projects, quotations and whatsapp admin APIs. Each of those routes is a
// thin wrapper passing its table, allowed statuses, entity name and any
// extra updatable fields.
// TODO(RECONSTRUCTION-GAP): the bundle chunk carries no "[project]/src/..."
// label for this module, so the original filename is not recoverable from
// the bundle. "admin-update.ts" and the function name
// "handleAdminStatusUpdate" are reconstruction-time names; the behaviour
// below is exact.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, logAudit, errorMessage } from "@/lib/admin-auth";

export type AdminUpdateOptions = {
  /** Supabase table to update. */
  table: string;
  /** Allowed values for the status field; when omitted, no status is set. */
  allowedStatuses?: string[];
  /** Column holding the status (default "status"). */
  statusField?: string;
  /** Primary-key column (default "id"). */
  idField?: string;
  /** Extra body fields copied verbatim into the update when present. */
  extraFields?: string[];
  /** Singular entity name used in the audit log, e.g. "project". */
  entity: string;
};

/**
 * PATCH { id, status?, ...extraFields } — admin only.
 * 400 when id is missing, the status is not allowed, or there is nothing to
 * update; the Supabase error surfaces as 503 with the message truncated to
 * 160 chars. On success writes an audit row `update:<table>` and returns
 * { ok: true, row }.
 */
export async function handleAdminStatusUpdate(req: NextRequest, options: AdminUpdateOptions) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id ?? "");
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (options.allowedStatuses) {
      const status = String(body.status ?? "");
      if (!options.allowedStatuses.includes(status)) {
        return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
      }
      patch[options.statusField ?? "status"] = status;
    }
    for (const field of options.extraFields ?? []) {
      if (body[field] !== undefined) patch[field] = body[field];
    }
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: false, error: "nothing to update" }, { status: 400 });
    }

    const admin = serviceSupabase();
    const { data, error } = await admin
      .from(options.table)
      .update(patch)
      .eq(options.idField ?? "id", id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(admin, auth.user.id, `update:${options.table}`, options.entity, id, patch);
    return NextResponse.json({ ok: true, row: data });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
