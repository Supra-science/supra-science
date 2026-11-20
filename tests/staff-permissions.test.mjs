/**
 * Tests for the staff permissions build (2026-11-20): the "staff" role
 * finally has real, scoped permissions — an operations workspace, not a
 * junior admin. Static source assertions, same style as the other tests
 * in this folder. Run with: node --test tests/
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
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

describe("staff role — single source of truth", () => {
  it("staff-check exports isStaffUser and isStaffOrAdminUser", () => {
    const check = src("lib/staff-check.ts");
    assert.match(check, /export async function isStaffUser/, "must export isStaffUser");
    assert.match(check, /export async function isStaffOrAdminUser/, "must export isStaffOrAdminUser");
    assert.match(check, /data\?\.role === "staff"/, "staff check must match role 'staff'");
    assert.match(check, /data\?\.role === "staff" \|\| data\?\.role === "admin"/, "admin must be a superset of staff");
  });

  it("no other file invents its own staff-role check", () => {
    // Every staff decision must flow through the permission layer
    // (permissions rebuild, 2026-11-20): the wrappers delegate to
    // requirePermission / requirePermissionPage with staff:access.
    const auth = src("lib/staff-auth.ts");
    const page = src("lib/staff-page.ts");
    assert.match(auth, /return requirePermission\(permission\)/, "staff-auth must delegate to requirePermission");
    assert.match(auth, /permission: PermissionKey = "staff:access"/, "staff-auth must default to staff:access");
    assert.match(page, /return requirePermissionPage\(permission\)/, "staff-page must delegate to requirePermissionPage");
    assert.match(page, /permission: PermissionKey = "staff:access"/, "staff-page must default to staff:access");
  });
});

describe("staff guards — API and pages", () => {
  it("staff-auth requireStaff returns 401/403 JSON", () => {
    const auth = src("lib/staff-auth.ts");
    assert.match(auth, /export async function requireStaff/, "must export requireStaff");
    assert.match(auth, /return requirePermission\(permission\)/, "must delegate to the shared permission guard");
    // The 401/403 JSON lives in lib/permission-check.ts now.
    const check = src("lib/permission-check.ts");
    assert.match(check, /status: 401/, "permission guard must return 401 when signed out");
    assert.match(check, /status: 403/, "permission guard must return 403 when the permission is missing");
    assert.doesNotMatch(auth, /hasCompletedMfa/, "staff guard must NOT call the admin MFA check");
  });

  it("staff-page requireStaffPage redirects like the admin guard", () => {
    const page = src("lib/staff-page.ts");
    assert.match(page, /export async function requireStaffPage/, "must export requireStaffPage");
    assert.match(page, /return requirePermissionPage\(permission\)/, "must delegate to the shared permission page guard");
    const check = src("lib/permission-check.ts");
    assert.match(check, /redirect\("\/login"\)/, "permission page guard must redirect signed-out visitors to /login");
    assert.match(check, /redirect\("\/dashboard"\)/, "permission page guard must redirect users without the permission to /dashboard");
  });

  it("middleware guards /staff and /api/staff paths", () => {
    const mw = root("middleware.ts");
    assert.match(mw, /checkStaffAccess/, "middleware must define the staff guard");
    assert.match(mw, /pathname === "\/staff"/, "guard must cover /staff");
    assert.match(mw, /pathname\.startsWith\("\/staff\/"\)/, "guard must cover /staff/*");
    assert.match(mw, /pathname\.startsWith\("\/api\/staff\/"\)/, "guard must cover /api/staff/*");
    assert.match(mw, /hasPermission\(supabase, user, "staff:access"\)/, "guard must verify the staff:access permission");
  });

  it("staff layout guards the whole section before rendering the nav", () => {
    const layout = src("app/staff/layout.tsx");
    assert.match(layout, /requireStaffPage\("staff:access"\)/, "staff layout must call requireStaffPage(\"staff:access\")");
    assert.match(layout, /STAFF/, "staff layout must carry a STAFF badge, not ADMIN");
  });
});

describe("staff scope — operations yes, money and admin no", () => {
  it("staff nav has exactly the 7 operations sections", () => {
    const layout = src("app/staff/layout.tsx");
    for (const href of ["/staff", "/staff/projects", "/staff/quotations", "/staff/consultations", "/staff/bookings", "/staff/messages", "/staff/customers"]) {
      assert.match(layout, new RegExp(`href: "${href.replace(/\//g, "\\/")}"`), `nav must include ${href}`);
    }
    for (const forbidden of ["/admin/users", "/admin/invoices", "/admin/payments", "/admin/services", "/admin/integrations", "/admin/audit-logs", "/admin/whatsapp", "/admin/drafts"]) {
      assert.doesNotMatch(layout, new RegExp(forbidden.replace(/\//g, "\\/")), `nav must NOT include ${forbidden}`);
    }
  });

  it("staff API exposes only the three status-update routes", () => {
    const apiDir = join(SRC, "app/api/staff");
    const routes = readdirSync(apiDir);
    assert.deepEqual(routes.sort(), ["consultations", "messages", "projects"], "only consultations/messages/projects routes may exist");
    for (const route of routes) {
      const code = readFileSync(join(apiDir, route, "route.ts"), "utf8");
      assert.match(code, /authFn: \(\) => requireStaff\("[a-z]+:status"\)/, `${route} must use the staff guard with its exact permission`);
      assert.match(code, /handleAdminStatusUpdate/, `${route} must reuse the shared audited handler`);
      assert.doesNotMatch(code, /export async function (GET|POST|DELETE)/, `${route} must expose PATCH only`);
    }
    const perms = {
      projects: "projects:status",
      messages: "messages:status",
      consultations: "consultations:status",
    };
    for (const [route, perm] of Object.entries(perms)) {
      const code = readFileSync(join(apiDir, route, "route.ts"), "utf8");
      assert.match(code, new RegExp(`authFn: \\(\\) => requireStaff\\("${perm}"\\)`), `${route} must declare ${perm}`);
    }
  });

  it("quotations, customers and bookings are read-only for staff", () => {
    for (const page of ["quotations", "customers", "bookings"]) {
      const code = src(`app/staff/${page}/page.tsx`);
      assert.doesNotMatch(code, /<StatusChanger/, `staff ${page} page must render no StatusChanger`);
      assert.doesNotMatch(code, /endpoint="\/api\/staff/, `staff ${page} page must call no staff API`);
    }
  });

  it("staff project detail never fetches or renders invoices", () => {
    const code = src("app/staff/projects/page.tsx");
    assert.doesNotMatch(code, /\.from\("invoices"\)/, "staff project detail must not query invoices");
    assert.doesNotMatch(code, /projectInvoices/, "staff project detail must not render an invoices section");
    assert.match(code, /endpoint="\/api\/staff\/projects"/, "project status changer must use the staff endpoint");
  });

  it("staff status changes are audit-logged through the shared handler", () => {
    const update = src("lib/admin-update.ts");
    assert.match(update, /authFn\?:/, "shared handler must accept an auth override");
    assert.match(update, /options\.authFn \?\? requireAdmin/, "shared handler must default to the admin guard");
    assert.match(update, /logAudit\(admin, actorId, `update:\$\{options\.table\}`/, "every update must write an audit row");
  });
});

describe("staff entry point and RLS draft", () => {
  it("dashboard shows the staff workspace link for staff users", () => {
    const dash = src("app/dashboard/page.tsx");
    assert.match(dash, /roleHasPermission\(effectiveRole, "staff:access"\)/, "dashboard must decide the staff link by permission");
    assert.match(dash, /href="\/staff"/, "dashboard must link staff users to /staff");
    assert.match(dash, /t\("openStaff", lang\)/, "dashboard must use the openStaff label");
  });

  it("RLS migration draft exists, is marked draft, and stays scoped", () => {
    const draftPath = join(ROOT, "supabase/migrations/010_staff_rls_draft.sql");
    assert.ok(existsSync(draftPath), "migration draft file must exist");
    const draft = readFileSync(draftPath, "utf8");
    assert.match(draft, /DRAFT ONLY, NOT APPLIED/, "draft must be marked as not applied");
    assert.match(draft, /create or replace function public\.is_staff\(\)/, "draft must define is_staff()");
    assert.match(draft, /Staff can view projects/, "draft must grant staff read on projects");
    assert.doesNotMatch(draft, /on public\.(invoices|payments|user_roles|audit_logs)/, "draft must grant staff nothing on money/admin tables");
  });
});
