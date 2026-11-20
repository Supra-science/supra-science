/**
 * Runtime tests for the permission resolver (Phase 1, 2026-11-20).
 *
 * Unlike the other test files here (static source assertions), this one
 * EXECUTES the real code: Node 24 strips types, so the pure module
 * src/lib/permissions.ts imports directly. If this file ever fails to
 * load, the resolver has gained a runtime dependency it must not have —
 * keep permissions.ts free of imports beyond the two sibling lib
 * modules (which themselves import nothing at runtime).
 *
 * Run with: node --test tests/
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  getRolePermissions,
  isPermissionKey,
  resolveEffectiveRole,
  roleHasPermission,
} from "../src/lib/permissions.ts";

const STAFF_EXPECTED = [
  "staff:access",
  "projects:read",
  "projects:status",
  "quotations:read",
  "customers:read",
  "consultations:read",
  "consultations:status",
  "bookings:read",
  "messages:read",
  "messages:status",
];

const ADMIN_ONLY = [
  "admin:access",
  "users:manage",
  "users:delete",
  "invoices:read",
  "invoices:manage",
  "payments:read",
  "payments:manage",
  "services:read",
  "services:manage",
  "audit:read",
  "drafts:manage",
  "integrations:manage",
  "whatsapp:manage",
  "notifications:read",
  "notifications:status",
  "quotations:status",
  "bookings:status",
];

describe("permission catalog", () => {
  it("holds exactly 27 permissions", () => {
    assert.equal(ALL_PERMISSIONS.length, 27, "catalog size is a contract — update the matrix test too");
    assert.equal(Object.keys(PERMISSIONS).length, 27);
    assert.deepEqual([...ALL_PERMISSIONS].sort(), Object.keys(PERMISSIONS).sort());
  });

  it("every key names a resource and an action", () => {
    for (const key of ALL_PERMISSIONS) {
      assert.match(key, /^[a-z]+:[a-z]+$/, `${key} must be resource:action`);
      assert.ok(PERMISSIONS[key].length > 0, `${key} must have a description`);
    }
  });

  it("isPermissionKey accepts catalog keys and rejects everything else", () => {
    assert.equal(isPermissionKey("projects:status"), true);
    assert.equal(isPermissionKey("projects:delete"), false);
    assert.equal(isPermissionKey("admin"), false);
    assert.equal(isPermissionKey(""), false);
    assert.equal(isPermissionKey("PROJECTS:STATUS"), false);
  });
});

describe("roleHasPermission — the matrix, executed", () => {
  it("admin holds every permission in the catalog (wildcard)", () => {
    for (const key of ALL_PERMISSIONS) {
      assert.equal(roleHasPermission("admin", key), true, `admin must hold ${key}`);
    }
  });

  it("staff holds exactly the 10 operations permissions", () => {
    assert.deepEqual([...ROLE_PERMISSIONS.staff].sort(), [...STAFF_EXPECTED].sort());
    for (const key of STAFF_EXPECTED) {
      assert.equal(roleHasPermission("staff", key), true, `staff must hold ${key}`);
    }
    for (const key of ADMIN_ONLY) {
      assert.equal(roleHasPermission("staff", key), false, `staff must NOT hold ${key}`);
    }
  });

  it("customer holds nothing", () => {
    assert.deepEqual(ROLE_PERMISSIONS.customer, []);
    for (const key of ALL_PERMISSIONS) {
      assert.equal(roleHasPermission("customer", key), false, `customer must NOT hold ${key}`);
    }
  });

  it("fail-closed: unknown permission is denied for everyone, admin included", () => {
    for (const role of ["admin", "staff", "customer"]) {
      assert.equal(roleHasPermission(role, "projects:delete"), false, `${role} must be denied an unknown permission`);
      assert.equal(roleHasPermission(role, ""), false);
    }
  });

  it("fail-closed: unknown role holds nothing", () => {
    for (const role of ["superadmin", "owner", "", "ADMIN"]) {
      assert.equal(roleHasPermission(role, "projects:read"), false, `unknown role ${role} must hold nothing`);
      assert.equal(roleHasPermission(role, "admin:access"), false);
    }
  });
});

describe("getRolePermissions", () => {
  it("admin gets the whole catalog, staff its 10, customer none", () => {
    assert.equal(getRolePermissions("admin").length, 27);
    assert.deepEqual([...getRolePermissions("staff")].sort(), [...STAFF_EXPECTED].sort());
    assert.deepEqual(getRolePermissions("customer"), []);
  });
});

describe("resolveEffectiveRole — owner allowlist", () => {
  it("the allowlisted owner email is admin in either case", () => {
    assert.equal(resolveEffectiveRole("Supra-science@proton.me", null), "admin");
    assert.equal(resolveEffectiveRole("supra-science@proton.me", null), "admin");
    // Even with a customer role row, the allowlist wins.
    assert.equal(resolveEffectiveRole("supra-science@proton.me", "customer"), "admin");
  });

  it("otherwise the database role decides, unknown means customer", () => {
    assert.equal(resolveEffectiveRole("goodyour583@gmail.com", "admin"), "admin");
    assert.equal(resolveEffectiveRole("mfydhzam@gmail.com", "staff"), "staff");
    assert.equal(resolveEffectiveRole("someone@example.com", "customer"), "customer");
    assert.equal(resolveEffectiveRole("someone@example.com", "superadmin"), "customer");
    assert.equal(resolveEffectiveRole("someone@example.com", null), "customer");
    assert.equal(resolveEffectiveRole(null, null), "customer");
    assert.equal(resolveEffectiveRole("goodyour583@gmail.com", "admin"), "admin");
  });
});
