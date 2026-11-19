// src/app/api/admin/projects/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 51867 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_1barcqx5cyvj9._.js`.
// PATCH { id, status } — admin only. Status must be one of the nine project
// pipeline stages. Delegates to the shared generic handler (see
// src/lib/admin-update.ts); a successful change writes an audit row
// `update:projects`.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";

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
  });
}
