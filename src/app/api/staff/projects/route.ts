// src/app/api/staff/projects/route.ts — NEW 2026-11-20 (staff permissions).
// PATCH { id, status } — staff or admin. Status must be one of the nine
// project pipeline stages. Delegates to the shared generic handler with
// the staff guard; a successful change writes an audit row
// `update:projects`. Staff may change project status but may NOT create,
// delete or re-price projects — there is deliberately no POST/DELETE here.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "projects",
    allowedStatuses: [
      "new_inquiry",
      "consultation",
      "requirements",
      "quotation",
      "awaiting_payment",
      "in_progress",
      "review",
      "completed",
      "cancelled",
    ],
    entity: "project",
    authFn: () => requireStaff("projects:status"),
  });
}
