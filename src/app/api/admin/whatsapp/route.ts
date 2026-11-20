// src/app/api/admin/whatsapp/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 51198 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_1ckivlq7ld-jd._.js`.
// PATCH { id, status } — admin only. Status must be open / pending /
// closed. Delegates to the shared generic handler (see
// src/lib/admin-update.ts); a successful change writes an audit row
// `update:whatsapp_conversations`.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "whatsapp_conversations",
    allowedStatuses: ["open", "pending", "closed"],
    entity: "whatsapp_conversation",
    authFn: () => requireAdmin("whatsapp:manage"),
  });
}
