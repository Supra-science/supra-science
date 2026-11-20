// src/app/api/admin/users/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 9814 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_1e8w9uuebtrcb._.js`.
// PATCH { user_id, role } — admin only. Role must be admin / staff /
// customer. Guards: an admin cannot change their own role (403); the
// owner role is never set here — ownership moves only through the
// transfer-owner route (403); the owner's role cannot be changed here
// (403); and the last remaining administrator cannot be demoted when
// there is no owner to keep the platform administered (403 — counted
// with an exact head-count query). The role is upserted into user_roles
// on user_id and the change is audited as `update:user_roles` with
// { from, to }.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, logAudit, errorMessage } from "@/lib/admin-auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "staff", "customer"];

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin("users:manage");
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = String(body.user_id ?? "");
    const role = String(body.role ?? "");
    if (!userId) return NextResponse.json({ ok: false, error: "user_id is required" }, { status: 400 });
    if (role === "owner") {
      return NextResponse.json({ ok: false, error: "Ownership moves only through the transfer-owner route" }, { status: 403 });
    }
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

    // The owner role is never set by a role change — ownership moves
    // only through POST /api/admin/users/transfer-owner.
    if (current?.role === "owner") {
      return NextResponse.json({ ok: false, error: "The owner's role can only change through ownership transfer" }, { status: 403 });
    }

    if (current?.role === "admin" && role !== "admin") {
      const [{ count: adminCount }, { count: ownerCount }] = await Promise.all([
        admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "owner"),
      ]);
      if ((adminCount ?? 0) <= 1 && (ownerCount ?? 0) === 0) {
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
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}

/**
 * DELETE { user_id } — admin only. Permanently removes a user account:
 * the auth user plus everything ON DELETE CASCADE removes with it
 * (profile, user_roles, customers row, AI conversations, architecture
 * drafts).
 *
 * Guards (in order):
 * 1. An admin cannot delete their own account (403).
 * 2. The platform owner (role `owner`) can never be deleted (403) —
 *    removing them would orphan the platform. Ownership moves only
 *    through the transfer-owner route.
 * 3. Deleting another ADMIN needs the owner (403 for a plain admin —
 *    checked with `owner:access`); deleting a staff member or customer
 *    stays an admin action (`users:delete`).
 * 4. The last remaining administrator cannot be deleted when there is
 *    no owner (403).
 * 5. Business-data block (409): deleting a user whose customers row has
 *    projects, quotations, invoices, payments or consultations would
 *    silently wipe that business history — every one of those tables is
 *    ON DELETE CASCADE from customers, which is CASCADE from auth.users.
 *    Such a user cannot be deleted until their business records are
 *    dealt with by an admin first. The response lists the counts.
 * 5. Audit/file block (409): audit_logs.actor_id and
 *    project_files.uploaded_by are RESTRICT (no action) — the database
 *    itself would refuse the delete. The response lists the counts.
 *
 * On success the deletion is audited as `delete:user` (actor = the admin
 * performing it, never the deleted user).
 */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin("users:delete");
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = String(body.user_id ?? "");
    if (!userId) return NextResponse.json({ ok: false, error: "user_id is required" }, { status: 400 });
    if (userId === auth.user.id) {
      return NextResponse.json({ ok: false, error: "You cannot delete your own account" }, { status: 403 });
    }

    const admin = serviceSupabase();
    const { data: target, error: targetError } = await admin.auth.admin.getUserById(userId);
    if (targetError) throw targetError;
    if (!target.user) return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    const email = String(target.user.email ?? "");

    const { data: current, error: fetchError } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    const role = current?.role ?? "customer";

    if (role === "owner") {
      return NextResponse.json({ ok: false, error: "Cannot delete the platform owner account" }, { status: 403 });
    }

    // Only the owner may delete another admin.
    if (role === "admin" && !(await hasPermission(auth.supabase, auth.user, "owner:access"))) {
      return NextResponse.json({ ok: false, error: "Only the platform owner can delete an administrator" }, { status: 403 });
    }

    if (role === "admin") {
      const [{ count: adminCount }, { count: ownerCount }] = await Promise.all([
        admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin"),
        admin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "owner"),
      ]);
      if ((adminCount ?? 0) <= 1 && (ownerCount ?? 0) === 0) {
        return NextResponse.json({ ok: false, error: "Cannot remove the last administrator" }, { status: 403 });
      }
    }

    // Business-data block: find the user's customers row, then count
    // everything that would cascade away with it.
    const { data: customer } = await admin
      .from("customers")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();
    const blockers: Record<string, number> = {};
    if (customer) {
      const customerId = String(customer.id);
      const tables = ["projects", "quotations", "invoices", "payments", "consultations"] as const;
      for (const table of tables) {
        const { count } = await admin
          .from(table)
          .select("id", { count: "exact", head: true })
          .eq("customer_id", customerId);
        if ((count ?? 0) > 0) blockers[table] = count ?? 0;
      }
    }
    const { count: auditCount } = await admin
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .eq("actor_id", userId);
    if ((auditCount ?? 0) > 0) blockers.audit_logs = auditCount ?? 0;
    const { count: fileCount } = await admin
      .from("project_files")
      .select("id", { count: "exact", head: true })
      .eq("uploaded_by", userId);
    if ((fileCount ?? 0) > 0) blockers.project_files = fileCount ?? 0;

    if (Object.keys(blockers).length > 0) {
      return NextResponse.json(
        { ok: false, error: "User has records that block deletion", blockers },
        { status: 409 },
      );
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw deleteError;

    await logAudit(admin, auth.user.id, "delete:user", "user", userId, { email, role });
    return NextResponse.json({ ok: true, deleted: { user_id: userId, email, role } });
  } catch (e) {
    const msg = errorMessage(e);
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
