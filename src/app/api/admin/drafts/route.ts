// src/app/api/admin/drafts/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 75707 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_1el3upt6b28ym._.js`.
// PATCH { id, status, project_id? } — admin only. Status must be draft /
// reviewed / converted. Delegates to the shared generic handler (see
// src/lib/admin-update.ts); a successful change writes an audit row
// `update:architecture_drafts`.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "architecture_drafts",
    allowedStatuses: ["draft", "reviewed", "converted"],
    entity: "architecture_draft",
    extraFields: ["project_id"],
  });
}
