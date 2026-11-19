// src/app/api/admin/bookings/route.ts — NEW in the Nov-8 2026 live build.
// Reconstructed from module 16186 in chunk
// `.open-next/server-functions/default/.next/server/chunks/_1ze8aesdtms43._.js`.
// PATCH { id, status } — admin only. Status must be booked / cancelled /
// completed. Cancelling a booking that has a Google Calendar event first
// deletes that event (via the calendar lib); if the delete fails the
// booking is left untouched and the call fails with 503. Every successful
// change writes an audit row `update:consultation_bookings`.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase, logAudit } from "@/lib/admin-auth";
// TODO(RECONSTRUCTION-GAP): the bundle only shows the minified export name
// ("s") of the calendar helper in src_lib_calendar_ts; the source export
// name is reconstructed here as cancelCalendarEvent. The helper DELETEs
// /calendars/<id>/events/<eventId> on Google Calendar (sendUpdates=all)
// and returns false (never throws) when it cannot — including a 404, which
// it treats as success.
import { cancelCalendarEvent } from "@/lib/calendar";

export const dynamic = "force-dynamic";

const STATUSES = ["booked", "cancelled", "completed"];

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id ?? "");
    const status = String(body.status ?? "");
    if (!id) return NextResponse.json({ ok: false, error: "id is required" }, { status: 400 });
    if (!STATUSES.includes(status)) return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });

    const admin = serviceSupabase();
    const { data: booking, error: fetchError } = await admin
      .from("consultation_bookings")
      .select("id, status, calendar_event_id")
      .eq("id", id)
      .single();
    if (fetchError || !booking) return NextResponse.json({ ok: false, error: "booking not found" }, { status: 404 });

    if (status === "cancelled" && booking.calendar_event_id) {
      const cancelled = await cancelCalendarEvent(String(booking.calendar_event_id));
      if (!cancelled) {
        return NextResponse.json(
          { ok: false, error: "Could not cancel the calendar event. Please try again." },
          { status: 503 },
        );
      }
    }

    const { data, error } = await admin
      .from("consultation_bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;

    await logAudit(admin, auth.user.id, "update:consultation_bookings", "booking", id, { status });
    return NextResponse.json({ ok: true, row: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
