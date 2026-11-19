// src/app/api/admin/consultations/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 80087 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_11-ls5uhexbk2._.js`.
// PATCH { id, status, scheduled_at? } — admin only. Status must be pending
// / scheduled / completed / cancelled. Delegates to the shared generic
// handler (see src/lib/admin-update.ts); a successful change writes an
// audit row `update:consultations`.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "consultations",
    allowedStatuses: ["pending", "scheduled", "completed", "cancelled"],
    entity: "consultation",
    extraFields: ["scheduled_at"],
  });
}
