// src/lib/admin-auth.ts — RECONSTRUCTED from the Nov-8 2026 live Cloudflare Workers bundle.
// Bundle evidence: module 67417 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_0ysn1wsdelszn._.js`.
// Used by every /api/admin/* route. Nov-5 base already had requireAdmin +
// serviceSupabase; the Nov-8 live build ADDS logAudit (export "C").
// The service-URL fallback below is reproduced exactly as found in the live
// bundle (a literal project URL, not a secret); the key still comes only from
// the SUPABASE_SERVICE_ROLE_KEY env var.

import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requirePermission } from "@/lib/permission-check";
import type { PermissionGuardResult } from "@/lib/permission-check";
import type { PermissionKey } from "@/lib/permissions";

/**
 * Best-effort audit write. Failures are swallowed so a logging failure can
 * never break the admin action itself.
 */
export async function logAudit(
  supabase: SupabaseClient,
  actorId: string,
  action: string,
  entityType: string,
  entityId: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    await supabase.from("audit_logs").insert({
      actor_id: actorId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  } catch {
    // Audit logging must never fail the request.
  }
}

/**
 * Error message extractor (2026-11-19): PostgREST errors are plain objects
 * with a `message` field, not Error instances — reading only Error.message
 * turned real failures into the bare word "failed" (first seen on the
 * role-change route). Use this in every admin-route catch.
 */
export function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "object" && e !== null && "message" in e) {
    return String((e as { message: unknown }).message);
  }
  return "failed";
}

/**
 * Verify the caller is an admin. Returns { user } or { error: NextResponse }.
 *
 * Permissions rebuild (2026-11-20): the area check is now the permission
 * `admin:access`, and each admin route passes the specific permission it
 * needs — the admin wildcard makes that check pass for every admin today,
 * and the declaration is what the permission matrix tests enforce. The
 * MFA gate below is unchanged: it applies to every admin call, whichever
 * permission was asked for.
 */
export async function requireAdmin(
  permission: PermissionKey = "admin:access",
): Promise<PermissionGuardResult> {
  const checked = await requirePermission(permission);
  if ("error" in checked) return checked;
  const { user, supabase } = checked;
  // MFA (added 2026-11-13, audit finding #6): an admin with an enrolled
  // TOTP factor must have completed verification (AAL2). Accounts without
  // an enrolled factor have nextLevel "aal1" and are unaffected.
  if (!(await hasCompletedMfa(supabase))) {
    return {
      error: NextResponse.json(
        { error: "MFA verification required" },
        { status: 403 },
      ) as NextResponse,
    };
  }
  return { user, supabase };
}

/**
 * True unless the session belongs to a user with an enrolled MFA factor
 * who has not completed verification yet (AAL1 while AAL2 is required).
 * Best-effort: if the AAL check itself fails, the signed-in session is
 * still accepted — the check reads the JWT locally and must not lock
 * an admin out on a transient failure.
 */
export async function hasCompletedMfa(
  supabase: SupabaseClient,
): Promise<boolean> {
  try {
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal?.nextLevel === "aal2" && aal?.currentLevel !== "aal2") return false;
    return true;
  } catch {
    return true;
  }
}

/** service_role client — bypasses RLS. Server only, never exposed. */
export function serviceSupabase() {
  const url = process.env.SUPABASE_URL || "https://ityzbuncztwgtxudcobr.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials not set");
  return createAdminClient(url, key);
}
