import { NextRequest, NextResponse } from "next/server";
import { isRateLimited } from "@/lib/rate-limit";
import {
  isCalendarConfigured,
  listCalendarEvents,
} from "@/lib/calendar";
// TODO(RECONSTRUCTION-GAP): the live bundle only preserves minified export
// letters for src/lib/booking.ts and src/lib/calendar.ts. The names used
// here are descriptive reconstructions — align them with the lib
// reconstruction (booking.ts exports, minified: B=30 slot minutes,
// W=parseDate, D=isWorkingDay, p=generateSlots, T=slotsOverlap).
import {
  SLOT_MINUTES,
  parseDate,
  isWorkingDay,
  generateSlots,
  slotsOverlap,
} from "@/lib/booking";

export const dynamic = "force-dynamic";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * GET /api/bookings/slots?date=YYYY-MM-DD
 *
 * Returns the free 30-minute slots for one working day (Sunday–Thursday,
 * 10:00–18:00 Aden time, UTC+3).
 *
 * Flow: rate-limit 10/min per IP → parse + working-day check (400 if the
 * date is not a working day) → generate the day's slots (empty list is a
 * valid 200) → 503 if calendar booking is not configured or the calendar
 * cannot be read → filter out slots overlapping existing calendar events.
 * (Reconstructed from the Nov-8 live bundle, userland module 89611.)
 */
export async function GET(req: NextRequest) {
  if (
    isRateLimited(`slots:${clientIp(req)}`, { windowMs: 60_000, max: 10 })
  ) {
    return NextResponse.json(
      { ok: false, error: "Too many requests. Please try again shortly." },
      { status: 429 },
    );
  }

  const date = req.nextUrl.searchParams.get("date") ?? "";
  const day = parseDate(date);
  if (!day || !isWorkingDay(date)) {
    return NextResponse.json(
      { ok: false, error: "Please choose a working day (Sunday–Thursday)." },
      { status: 400 },
    );
  }

  const slots = generateSlots(date);
  if (slots.length === 0) {
    return NextResponse.json({ ok: true, date, slots: [] });
  }

  if (!isCalendarConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Calendar booking is not configured yet." },
      { status: 503 },
    );
  }

  // Whole Aden day in UTC: 10:00–18:00 Aden = 07:00–21:00 UTC.
  const from = new Date(Date.UTC(day.y, day.m - 1, day.d, -3, 0)).toISOString();
  const to = new Date(Date.UTC(day.y, day.m - 1, day.d, 21, 0)).toISOString();
  const events = await listCalendarEvents(from, to);
  if (events === null) {
    return NextResponse.json(
      { ok: false, error: "Calendar could not be read. Please try again." },
      { status: 503 },
    );
  }

  const free = slots.filter((slot: string) => {
    const end = new Date(
      Date.parse(slot) + 60_000 * SLOT_MINUTES,
    ).toISOString();
    return !events.some(
      (ev: { start: string; end: string }) =>
        slotsOverlap(slot, end, ev.start, ev.end),
    );
  });

  return NextResponse.json({ ok: true, date, slots: free });
}
