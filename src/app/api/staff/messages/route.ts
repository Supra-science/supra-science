// src/app/api/staff/messages/route.ts — NEW 2026-11-20 (staff permissions).
// PATCH { id, status } — staff or admin. Status must be new / read /
// replied / archived. Delegates to the shared generic handler with the
// staff guard; a successful change writes an audit row
// `update:contact_messages`. Marking "replied" records that the reply
// went out (by email/WhatsApp); it does not send anything itself.

import { NextRequest } from "next/server";
import { handleAdminStatusUpdate } from "@/lib/admin-update";
import { requireStaff } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  return handleAdminStatusUpdate(req, {
    table: "contact_messages",
    allowedStatuses: ["new", "read", "replied", "archived"],
    entity: "contact_message",
    authFn: () => requireStaff("messages:status"),
  });
}
