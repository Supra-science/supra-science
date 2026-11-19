// src/app/api/admin/messages/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 14541 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_0rtz2o7bivfc_._.js`.
// PATCH { id, status } — admin only. Status must be new / read / replied /
// archived. Delegates to the shared generic handler (see
// src/lib/admin-update.ts); a successful change writes an audit row
// `update:contact_messages`.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "contact_messages",
    allowedStatuses: ["new", "read", "replied", "archived"],
    entity: "contact_message",
  });
}
