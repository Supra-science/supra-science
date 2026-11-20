// src/app/api/staff/consultations/route.ts — NEW 2026-11-20 (staff permissions).
// PATCH { id, status, scheduled_at? } — staff or admin. Status must be
// pending / scheduled / completed / cancelled. Delegates to the shared
// generic handler with the staff guard; a successful change writes an
// audit row `update:consultations`.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "consultations",
    allowedStatuses: ["pending", "scheduled", "completed", "cancelled"],
    entity: "consultation",
    extraFields: ["scheduled_at"],
    authFn: () => requireStaff("consultations:status"),
    useSessionClient: true,
  });
}
