// src/app/api/admin/quotations/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 44757 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_1ygd-jfcc1uu5._.js`.
// PATCH { id, status } — admin only. Status must be draft / sent / approved
// / rejected / expired. Delegates to the shared generic handler (see
// src/lib/admin-update.ts); a successful change writes an audit row
// `update:quotations`.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "quotations",
    allowedStatuses: ["draft", "sent", "approved", "rejected", "expired"],
    entity: "quotation",
  });
}
