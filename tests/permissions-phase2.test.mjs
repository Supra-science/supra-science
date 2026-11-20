/**
 * Phase 2 tests (2026-11-20): RLS enforcement + session-based reads.
 *
 * Phase 2 converts the staff workspace from the service_role client
 * (which bypasses RLS) to the caller's own session, with migration 010
 * as the database layer. These static assertions guard the contract:
 *  - no /staff page can reach the service_role client;
 *  - every staff page reads through the session client its guard returns;
 *  - the staff bookings page reads the real table (consultation_bookings);
 *  - staff status updates run as the caller's session, audit stays service_role;
 *  - admin routes keep service_role (unchanged behaviour);
 *  - migration 010 matches the live schema (no `bookings` table) and
 *    covers admins on the tables staff reads, or admin-in-/staff breaks.
 *
 * Static source assertions, same style as the other tests in this
 * folder. Run with: node --test tests/
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
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

const STAFF_PAGES = [
  "app/staff/page.tsx",
  "app/staff/projects/page.tsx",
  "app/staff/quotations/page.tsx",
  "app/staff/consultations/page.tsx",
  "app/staff/bookings/page.tsx",
  "app/staff/messages/page.tsx",
  "app/staff/customers/page.tsx",
];

const STAFF_PATCH_ROUTES = [
  "app/api/staff/projects/route.ts",
  "app/api/staff/consultations/route.ts",
  "app/api/staff/messages/route.ts",
];

describe("staff pages read through the session client", () => {
  for (const rel of STAFF_PAGES) {
    it(`${rel} never touches the service_role client`, () => {
      const code = src(rel);
      assert(!code.includes("getServiceSupabase"), "still imports getServiceSupabase");
      assert(!code.includes("serviceSupabase"), "still uses the service client");
      assert(!code.includes("SUPABASE_SERVICE_ROLE_KEY"), "touches the service key");
    });
    it(`${rel} uses the session client from its guard`, () => {
      const code = src(rel);
      assert.match(
        code,
        /const \{ supabase \} = await requireStaffPage\("[a-z:]+"\)/,
        "must destructure supabase from requireStaffPage",
      );
    });
  }

  it("staff-page.ts does not re-export the service client", () => {
    const code = src("lib/staff-page.ts");
    assert(!code.includes("export { getServiceSupabase }"), "re-export still present");
    assert(!code.includes("getServiceSupabase } from"), "still imports the service client");
  });
});

describe("staff bookings reads the real table", () => {
  it("bookings page selects from consultation_bookings", () => {
    const code = src("app/staff/bookings/page.tsx");
    assert(code.includes('.from("consultation_bookings")'));
    assert(!code.includes('.from("bookings")'), "still reads the non-existent bookings table");
  });
});

describe("staff status updates run as the caller session", () => {
  for (const rel of STAFF_PATCH_ROUTES) {
    it(`${rel} passes useSessionClient`, () => {
      assert(src(rel).includes("useSessionClient: true"));
    });
  }

  it("handler uses the session client for the update when flagged", () => {
    const code = src("lib/admin-update.ts");
    assert(code.includes("useSessionClient?: boolean"));
    assert.match(
      code,
      /const db = options\.useSessionClient && sessionClient \? sessionClient : serviceSupabase\(\)/,
    );
    assert(code.includes("await db\n      .from(options.table)"));
  });

  it("handler always writes the audit row with service_role", () => {
    const code = src("lib/admin-update.ts");
    assert(code.includes("await logAudit(serviceSupabase(), actorId"));
    assert(!code.includes("await logAudit(db,"), "audit must never go through the session client");
  });

  it("no admin route opts into the session client", () => {
    const adminRoutes = readdirSync(join(SRC, "app/api/admin"), { recursive: true })
      .filter((f) => f.endsWith("route.ts"))
      .map((f) => join("app/api/admin", f));
    assert(adminRoutes.length > 0, "expected admin routes to exist");
    for (const rel of adminRoutes) {
      assert(!src(rel).includes("useSessionClient"), `${rel} must keep service_role`);
    }
  });
});

describe("migration 010 matches the live schema", () => {
  const sql = root("supabase/migrations/010_staff_rls_draft.sql");

  it("has no policy on the non-existent bookings table", () => {
    assert(!sql.includes("public.bookings"), "there is no bookings table in production");
  });

  it("grants staff SELECT on consultation_bookings", () => {
    assert(sql.includes("Staff can view consultation_bookings"));
    assert(sql.includes("on public.consultation_bookings for select"));
  });

  it("grants staff SELECT on the other five operational tables", () => {
    for (const table of ["projects", "quotations", "customers", "consultations", "contact_messages"]) {
      assert(sql.includes(`on public.${table} for select`), `missing staff SELECT on ${table}`);
    }
  });

  it("grants staff UPDATE on the three status tables", () => {
    for (const table of ["projects", "consultations", "contact_messages"]) {
      assert(sql.includes(`on public.${table} for update`), `missing staff UPDATE on ${table}`);
    }
  });

  it("covers admins on the tables staff reads, or admin-in-/staff breaks", () => {
    for (const table of ["projects", "quotations", "customers", "consultations"]) {
      assert(sql.includes(`"Admins can manage ${table}"`), `missing admin policy on ${table}`);
      assert(sql.includes(`on public.${table} for all`), `admin policy on ${table} is not ALL`);
    }
  });

  it("grants staff nothing on financial or identity tables", () => {
    for (const table of ["invoices", "payments", "user_roles", "audit_logs", "services"]) {
      assert(!sql.includes(`on public.${table} for select to authenticated using (is_staff())`));
      assert(!sql.includes(`on public.${table} for update to authenticated`));
    }
  });
});
