/**
 * Permission matrix tests (Phase 1, 2026-11-20).
 *
 * The matrix is the contract: every admin/staff route and page declares
 * exactly the permission it needs, the code catalog and the database
 * seed (migration 011) can never drift apart, and no route checks a
 * role directly — every decision flows through the permission layer.
 *
 * Static source assertions, same style as the other tests in this
 * folder. Run with: node --test tests/
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src");

function src(rel) {
  return readFileSync(join(SRC, rel), "utf8");
}
function root(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(p);
  }
  return out;
}

/** Permission keys declared in a file's guard calls. */
function guardPermissions(code) {
  const found = new Set();
  for (const m of code.matchAll(/require(?:Admin|Staff)(?:Page)?\("([a-z:]+)"\)/g)) {
    found.add(m[1]);
  }
  return found;
}

/** The full route x permission contract. file -> expected permissions. */
const MATRIX = {
  // --- admin API ---
  "app/api/admin/bookings/route.ts": ["bookings:status"],
  "app/api/admin/consultations/route.ts": ["consultations:status"],
  "app/api/admin/drafts/route.ts": ["drafts:manage"],
  "app/api/admin/invoices/route.ts": ["invoices:read", "invoices:manage"],
  "app/api/admin/messages/route.ts": ["messages:status"],
  "app/api/admin/notifications/route.ts": ["notifications:status"],
  "app/api/admin/payments/route.ts": ["payments:manage"],
  "app/api/admin/projects/route.ts": ["projects:status"],
  "app/api/admin/quotations/route.ts": ["quotations:status"],
  "app/api/admin/services/route.ts": ["services:read", "services:manage"],
  "app/api/admin/users/route.ts": ["users:manage", "users:delete"],
  "app/api/admin/whatsapp/route.ts": ["whatsapp:manage"],
  "app/api/admin/whatsapp/send/route.ts": ["whatsapp:manage"],
  // --- staff API (status changes only — the three routes) ---
  "app/api/staff/consultations/route.ts": ["consultations:status"],
  "app/api/staff/messages/route.ts": ["messages:status"],
  "app/api/staff/projects/route.ts": ["projects:status"],
  // --- admin pages ---
  "app/admin/page.tsx": ["admin:access"],
  "app/admin/layout.tsx": ["admin:access"],
  "app/admin/users/page.tsx": ["users:manage"],
  "app/admin/customers/page.tsx": ["customers:read"],
  "app/admin/projects/page.tsx": ["projects:read"],
  "app/admin/quotations/page.tsx": ["quotations:read"],
  "app/admin/invoices/page.tsx": ["invoices:read"],
  "app/admin/payments/page.tsx": ["payments:read"],
  "app/admin/services/page.tsx": ["services:read"],
  "app/admin/bookings/page.tsx": ["bookings:read"],
  "app/admin/consultations/page.tsx": ["consultations:read"],
  "app/admin/messages/page.tsx": ["messages:read"],
  "app/admin/notifications/page.tsx": ["notifications:read"],
  "app/admin/integrations/page.tsx": ["integrations:manage"],
  "app/admin/audit-logs/page.tsx": ["audit:read"],
  "app/admin/drafts/page.tsx": ["drafts:manage"],
  "app/admin/whatsapp/page.tsx": ["whatsapp:manage"],
  // --- staff pages ---
  "app/staff/page.tsx": ["staff:access"],
  "app/staff/layout.tsx": ["staff:access"],
  "app/staff/projects/page.tsx": ["projects:read"],
  "app/staff/quotations/page.tsx": ["quotations:read"],
  "app/staff/customers/page.tsx": ["customers:read"],
  "app/staff/consultations/page.tsx": ["consultations:read"],
  "app/staff/bookings/page.tsx": ["bookings:read"],
  "app/staff/messages/page.tsx": ["messages:read"],
};

describe("code catalog == database seed (migration 011)", () => {
  it("permissions.ts catalog and the 011 seed hold the same 27 keys", () => {
    const code = src("lib/permissions.ts");
    const codeKeys = new Set([...code.matchAll(/^  "([a-z]+:[a-z]+)":/gm)].map((m) => m[1]));
    const sql = root("supabase/migrations/011_permissions_draft.sql");
    const seedBlock = sql.slice(
      sql.indexOf("INSERT INTO public.permissions"),
      sql.indexOf("ON CONFLICT (key)"),
    );
    const sqlKeys = new Set([...seedBlock.matchAll(/\('([a-z]+:[a-z]+)',/g)].map((m) => m[1]));
    assert.equal(codeKeys.size, 27, `code catalog must hold 27 keys, got ${codeKeys.size}`);
    assert.equal(sqlKeys.size, 27, `SQL seed must hold 27 keys, got ${sqlKeys.size}`);
    assert.deepEqual([...codeKeys].sort(), [...sqlKeys].sort(), "code catalog and SQL seed must match exactly");
  });

  it("staff role rows match in code and SQL, customer holds nothing", () => {
    const code = src("lib/permissions.ts");
    const staffBlock = code.slice(code.indexOf("staff: ["), code.indexOf("],", code.indexOf("staff: [")));
    const codeStaff = new Set([...staffBlock.matchAll(/"([a-z]+:[a-z]+)"/g)].map((m) => m[1]));
    const sql = root("supabase/migrations/011_permissions_draft.sql");
    const roleBlock = sql.slice(
      sql.indexOf("INSERT INTO public.role_permissions"),
      sql.indexOf("ON CONFLICT DO NOTHING;"),
    );
    const sqlStaff = new Set(
      [...roleBlock.matchAll(/\('staff', '([a-z]+:[a-z]+)'\)/g)].map((m) => m[1]),
    );
    assert.equal(codeStaff.size, 10, `code staff list must hold 10, got ${codeStaff.size}`);
    assert.deepEqual([...codeStaff].sort(), [...sqlStaff].sort(), "code staff list and SQL staff seed must match");
    assert.doesNotMatch(roleBlock, /\('customer',/, "SQL seed must hold no customer rows");
    assert.doesNotMatch(roleBlock, /\('admin',/, "SQL seed must hold no admin rows by hand (trigger grants them)");
  });

  it("migration 011 is a draft with the admin auto-grant and read-only RLS", () => {
    const sql = root("supabase/migrations/011_permissions_draft.sql");
    assert.match(sql, /DRAFT ONLY, NOT APPLIED/, "011 must be marked as not applied");
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.grant_permission_to_admin\(\)/, "011 must define the admin auto-grant function");
    assert.match(sql, /CREATE TRIGGER permissions_grant_admin/, "011 must create the auto-grant trigger");
    assert.match(sql, /SELECT 'admin', key FROM public\.permissions/, "011 must backfill admin for existing keys");
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/, "011 must enable RLS on the permission tables");
    assert.match(sql, /FOR SELECT TO authenticated USING \(true\)/, "011 must let authenticated users read the catalog");
    assert.doesNotMatch(sql, /FOR (INSERT|UPDATE|DELETE)/, "011 must grant no API writes (service_role only)");
  });
});

describe("the matrix — every route and page declares its permission", () => {
  it("every file in the matrix declares exactly its contracted permissions", () => {
    for (const [file, expected] of Object.entries(MATRIX)) {
      const actual = guardPermissions(src(file));
      assert.deepEqual(
        [...actual].sort(),
        [...expected].sort(),
        `${file} must declare exactly ${expected.join(", ")}`,
      );
    }
  });

  it("no other file calls a guard — a new route without a matrix entry fails here", () => {
    const calling = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      if (guardPermissions(readFileSync(file, "utf8")).size > 0) calling.push(rel);
    }
    const mw = root("middleware.ts");
    assert.doesNotMatch(mw, /require(?:Admin|Staff)(?:Page)?\("/, "middleware must use hasPermission, not the page/API guards");
    assert.deepEqual(
      calling.sort(),
      Object.keys(MATRIX).sort(),
      "every guard call must live in a matrix file",
    );
  });

  it("every declared permission exists in the catalog", () => {
    const code = src("lib/permissions.ts");
    const catalog = new Set([...code.matchAll(/^  "([a-z]+:[a-z]+)":/gm)].map((m) => m[1]));
    for (const file of walk(SRC)) {
      for (const perm of guardPermissions(readFileSync(file, "utf8"))) {
        assert.ok(catalog.has(perm), `${file} uses unknown permission ${perm}`);
      }
    }
  });

  it("no bare guard calls remain — every call site names its permission", () => {
    const bad = [];
    for (const file of walk(SRC)) {
      const code = readFileSync(file, "utf8");
      if (/require(?:Admin|Staff)(?:Page)?\(\)/.test(code)) bad.push(file.slice(SRC.length + 1));
    }
    assert.deepEqual(bad, [], `bare guard calls in: ${bad.join(", ")}`);
  });
});

describe("guard chain — wrappers delegate, MFA preserved, no role shortcuts", () => {
  it("admin-auth requireAdmin checks the permission, then MFA", () => {
    const auth = src("lib/admin-auth.ts");
    assert.match(auth, /export async function requireAdmin\(\s*permission: PermissionKey = "admin:access"/, "requireAdmin must default to admin:access");
    assert.match(auth, /await requirePermission\(permission\)/, "requireAdmin must check the permission first");
    assert.match(auth, /hasCompletedMfa\(supabase\)/, "requireAdmin must still enforce MFA for admins");
  });

  it("admin-page requireAdminPage checks the permission, then MFA", () => {
    const page = src("lib/admin-page.ts");
    assert.match(page, /export async function requireAdminPage\(\s*permission: PermissionKey = "admin:access"/, "requireAdminPage must default to admin:access");
    assert.match(page, /await requirePermissionPage\(permission\)/, "requireAdminPage must check the permission first");
    assert.match(page, /hasCompletedMfa\(supabase\)/, "requireAdminPage must still enforce MFA for admins");
  });

  it("staff guards delegate with no MFA, as before", () => {
    const auth = src("lib/staff-auth.ts");
    assert.match(auth, /export async function requireStaff\(\s*permission: PermissionKey = "staff:access"/, "requireStaff must default to staff:access");
    assert.match(auth, /return requirePermission\(permission\)/, "requireStaff must delegate to requirePermission");
    assert.doesNotMatch(auth, /hasCompletedMfa/, "staff API guard must NOT call the admin MFA check");
    const page = src("lib/staff-page.ts");
    assert.match(page, /export async function requireStaffPage\(\s*permission: PermissionKey = "staff:access"/, "requireStaffPage must default to staff:access");
    assert.match(page, /return requirePermissionPage\(permission\)/, "requireStaffPage must delegate to requirePermissionPage");
    assert.doesNotMatch(page, /hasCompletedMfa/, "staff page guard must NOT call the admin MFA check");
  });

  it("middleware gates the areas through hasPermission", () => {
    const mw = root("middleware.ts");
    assert.match(mw, /hasPermission\(supabase, user, "admin:access"\)/, "admin area must be gated by the admin:access permission");
    assert.match(mw, /hasPermission\(supabase, user, "staff:access"\)/, "staff area must be gated by the staff:access permission");
    assert.doesNotMatch(mw, /isAdminUser\(/, "middleware must not call the role primitive directly");
    assert.doesNotMatch(mw, /isStaffOrAdminUser\(/, "middleware must not call the role primitive directly");
  });

  it("routes never call the raw permission guard — only the wrappers do", () => {
    const callers = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      if (rel === "lib/permission-check.ts") continue; // the definition itself
      if (/requirePermission\(/.test(readFileSync(file, "utf8"))) callers.push(rel);
    }
    assert.deepEqual(
      callers.sort(),
      ["lib/admin-auth.ts", "lib/staff-auth.ts"],
      "only the API wrappers may call requirePermission",
    );
    const pageCallers = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      if (rel === "lib/permission-check.ts") continue; // the definition itself
      if (/requirePermissionPage\(/.test(readFileSync(file, "utf8"))) pageCallers.push(rel);
    }
    assert.deepEqual(
      pageCallers.sort(),
      ["lib/admin-page.ts", "lib/staff-page.ts"],
      "only the page wrappers may call requirePermissionPage",
    );
  });

  it("no caller-role check outside the permission layer", () => {
    const bad = [];
    for (const file of walk(SRC)) {
      const rel = file.slice(SRC.length + 1);
      if (rel.startsWith("lib/")) continue;
      const code = readFileSync(file, "utf8");
      if (/isAdminUser\(|isStaffUser\(|isStaffOrAdminUser\(/.test(code)) bad.push(rel);
    }
    assert.deepEqual(bad, [], `direct role checks outside src/lib in: ${bad.join(", ")}`);
  });

  it("dashboard decides links by permission, not by role comparison", () => {
    const dash = src("app/dashboard/page.tsx");
    assert.match(dash, /resolveEffectiveRole\(user\.email, role\?\.role\)/, "dashboard must resolve the effective role");
    assert.match(dash, /roleHasPermission\(effectiveRole, "admin:access"\)/, "admin link must be a permission decision");
    assert.match(dash, /roleHasPermission\(effectiveRole, "staff:access"\)/, "staff link must be a permission decision");
    assert.doesNotMatch(dash, /role\?\.role ===/, "dashboard must not compare the role string directly");
  });
});
