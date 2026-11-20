/**
 * Tests for the admin user-control build (2026-11-20): the admin can now
 * remove users entirely — not just change their role — with guards that
 * keep the platform from deleting itself or wiping business history.
 * Static source assertions, same style as the other tests in this folder.
 * Run with: node --test tests/
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

function src(rel) {
  return readFileSync(join(SRC, rel), "utf8");
}

describe("admin user deletion — endpoint", () => {
  it("users route exports a DELETE handler guarded by requireAdmin", () => {
    const route = src("app/api/admin/users/route.ts");
    assert.match(route, /export async function DELETE/, "route must export DELETE");
    const del = route.slice(route.indexOf("export async function DELETE"));
    assert.match(del, /const auth = await requireAdmin\("users:delete"\);/, "DELETE must require the users:delete permission first");
    assert.match(del, /if \(auth\.error\) return auth\.error;/, "DELETE must return requireAdmin's 401/403 error");
  });

  it("admin cannot delete their own account", () => {
    const route = src("app/api/admin/users/route.ts");
    assert.match(route, /if \(userId === auth\.user\.id\)/, "DELETE must compare against the signed-in admin");
    assert.match(route, /You cannot delete your own account/, "DELETE must refuse self-deletion");
  });

  it("the platform owner account cannot be deleted", () => {
    const route = src("app/api/admin/users/route.ts");
    assert.match(route, /role === "owner"\) \{\s+return NextResponse\.json\(\{ ok: false, error: "Cannot delete the platform owner account"/, "DELETE must refuse the owner role (not the email allowlist anymore)");
    assert.doesNotMatch(route, /ADMIN_EMAILS\.includes\(email\)/, "DELETE must no longer check the email allowlist for the owner");
    assert.match(route, /admin\.auth\.admin\.getUserById\(userId\)/, "DELETE must fetch the target to learn its email");
  });

  it("the last administrator cannot be deleted", () => {
    const route = src("app/api/admin/users/route.ts");
    assert.match(route, /if \(role === "admin"\)/, "DELETE must check the target role");
    assert.match(route, /Cannot remove the last administrator/, "DELETE must refuse last-admin removal");
  });

  it("business records block deletion with a 409 listing the counts", () => {
    const route = src("app/api/admin/users/route.ts");
    for (const table of ["projects", "quotations", "invoices", "payments", "consultations"]) {
      assert.match(route, new RegExp(`"${table}"`), `DELETE must count ${table} before deleting`);
    }
    assert.match(route, /status: 409/, "DELETE must return 409 when records block it");
    assert.match(route, /User has records that block deletion/, "DELETE must explain the block");
    assert.match(route, /blockers/, "DELETE must return the per-table counts");
  });

  it("audit rows and uploaded files block deletion (RESTRICT foreign keys)", () => {
    const route = src("app/api/admin/users/route.ts");
    assert.match(route, /\.from\("audit_logs"\)/, "DELETE must count audit_logs (actor_id is RESTRICT)");
    assert.match(route, /\.from\("project_files"\)/, "DELETE must count project_files (uploaded_by is RESTRICT)");
  });

  it("deletion uses the Auth Admin API and is audit-logged", () => {
    const route = src("app/api/admin/users/route.ts");
    assert.match(route, /admin\.auth\.admin\.deleteUser\(userId\)/, "DELETE must remove the auth user (cascades profile/roles/customer)");
    assert.match(route, /logAudit\(admin, auth\.user\.id, "delete:user"/, "deletion must be audited as delete:user by the acting admin");
  });
});

describe("admin user deletion — UI", () => {
  it("DeleteUserButton sends DELETE after a confirm, in red", () => {
    const actions = src("components/admin-actions.tsx");
    assert.match(actions, /export function DeleteUserButton/, "must export DeleteUserButton");
    assert.match(actions, /method: "DELETE"/, "button must use the DELETE method");
    assert.match(actions, /window\.confirm\(confirmText\)/, "button must confirm before deleting");
    assert.match(actions, /#dc2626/, "delete button must be styled red");
    assert.match(actions, /blockers/, "button must surface the 409 blocker counts inline");
  });

  it("users page offers deletion only on other users' rows, never the owner's", () => {
    const page = src("app/admin/users/page.tsx");
    assert.match(page, /<DeleteUserButton/, "users page must render the delete button");
    assert.match(page, /\{!isSelf && role !== "owner" && \(/, "delete button must be hidden on the admin's own row and on the owner's row");
    assert.match(page, /endpoint="\/api\/admin\/users"/, "delete button must target the users API");
    assert.match(page, /t\("deleteUser", lang\)/, "delete button must use the deleteUser label");
  });

  it("role change (PATCH) guards are untouched", () => {
    const route = src("app/api/admin/users/route.ts");
    assert.match(route, /export async function PATCH/, "PATCH handler must still exist");
    assert.match(route, /const auth = await requireAdmin\("users:manage"\);/, "PATCH must require the users:manage permission");
    assert.match(route, /You cannot change your own role/, "PATCH must still refuse self role change");
    assert.match(route, /upsert\(\{ user_id: userId, role \}/, "PATCH must still upsert the role");
  });
});

describe("admin user deletion — scope boundaries", () => {
  it("staff has no user-deletion route", () => {
    assert.ok(!existsSync(join(SRC, "app/api/staff/users")), "staff must have no users API at all");
  });

  it("i18n carries the delete label and the updated lead", () => {
    const dict = src("lib/i18n.ts");
    assert.match(dict, /deleteUser: \{ ar: "إزالة المستخدم"/, "dictionary must hold deleteUser");
    assert.match(dict, /الإزالة نهائية/, "usersLead must warn that removal is permanent");
  });
});
