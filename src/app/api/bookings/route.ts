import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isRateLimited } from "@/lib/rate-limit";
import { verifyRecaptcha } from "@/lib/recaptcha";
import {
  isCalendarConfigured,
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/calendar";
import {
  sendBookingConfirmation,
  sendBookingAdminNotification,
} from "@/lib/email";
// TODO(RECONSTRUCTION-GAP): the live bundle only preserves minified export
// letters for src/lib/booking.ts and src/lib/calendar.ts. The names used
// here are descriptive reconstructions — align them with the lib
// reconstruction (booking.ts exports, minified: B=30 slot minutes,
// j=adenDateOf, p=generateSlots, T=slotsOverlap, v=validateBooking;
// calendar.ts exports, minified: e=createCalendarEvent,
// s=deleteCalendarEvent, K=listCalendarEvents, j=isCalendarConfigured;
// email.ts exports, minified: F=sendBookingConfirmation,
// H=sendBookingAdminNotification).
import {
  SLOT_MINUTES,
  adenDateOf,
  generateSlots,
  slotsOverlap,
  validateBooking,
} from "@/lib/booking";

export const dynamic = "force-dynamic";

function getServiceSupabase() {
  const url =
    process.env.SUPABASE_URL || "https://ityzbuncztwgtxudcobr.supabase.co";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service credentials not set");
  return createAdminClient(url, key);
}

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * POST /api/bookings — create a free 30-minute consultation booking.
 *
 * Body: { name, email, phone?, topic, service_slug?, start (ISO),
 *         recaptcha_token? }
 *
 * Flow: rate-limit 5/10 min per IP (429) → validate payload (400) → the
 * requested start must still be a generated slot for its Aden day (409)
 * → reCAPTCHA verify (403 unless the gate is not configured) → 503 if
 * calendar booking is not configured or the calendar cannot be read →
 * re-check overlap against the calendar (409 if just taken) → create the
 * Google Calendar event (with Meet link) → insert into
 * `consultation_bookings` (duplicate key → delete the event, 409) →
 * send the visitor confirmation email and the admin notification
 * (best-effort) and mark `email_sent`.
 *
 * On any database failure the calendar event is deleted again, so a
 * booking never exists in the calendar without a database row (503).
 * (Reconstructed from the Nov-8 live bundle, userland module 76886.)
 */
export async function POST(req: NextRequest) {
  try {
    if (
      isRateLimited(`booking:${clientIp(req)}`, {
        windowMs: 10 * 60_000,
        max: 5,
      })
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "Too many booking attempts. Please try again in a few minutes.",
        },
        { status: 429 },
      );
    }

    const body = await req.json().catch(() => ({}));
    const validationError = validateBooking(body);
    if (validationError) {
      return NextResponse.json(
        { ok: false, error: validationError },
        { status: 400 },
      );
    }

    const name = String(body.name).trim();
    const email = String(body.email).trim();
    const phone = body.phone ? String(body.phone).trim().slice(0, 40) : null;
    const topic = String(body.topic).trim();
    const serviceSlug =
      typeof body.service_slug === "string"
        ? body.service_slug.slice(0, 80)
        : null;
    const start = String(body.start).trim();
    const day = adenDateOf(start);
    if (!day || !generateSlots(day).includes(start)) {
      return NextResponse.json(
        {
          ok: false,
          error: "That time is no longer available. Please pick another slot.",
        },
        { status: 409 },
      );
    }

    const end = new Date(
      Date.parse(start) + 60_000 * SLOT_MINUTES,
    ).toISOString();
    const recaptchaToken =
      typeof body.recaptcha_token === "string" ? body.recaptcha_token : "";
    const recaptcha = await verifyRecaptcha(
      recaptchaToken || null,
      "booking",
      clientIp(req),
    );
    if (!recaptcha.verified) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "Human verification failed. Please try again, or reach us directly on WhatsApp (+1 917 818-3426).",
        },
        { status: 403 },
      );
    }

    if (!isCalendarConfigured()) {
      return NextResponse.json(
        { ok: false, error: "Calendar booking is not configured yet." },
        { status: 503 },
      );
    }

    const events = await listCalendarEvents(start, end);
    if (events === null) {
      return NextResponse.json(
        { ok: false, error: "Calendar could not be read. Please try again." },
        { status: 503 },
      );
    }
    if (
      events.some(
        (ev: { start: string; end: string }) =>
          slotsOverlap(start, end, ev.start, ev.end),
      )
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "That time was just taken. Please pick another slot.",
        },
        { status: 409 },
      );
    }

    const event = await createCalendarEvent({
      summary: `Supra-Science consultation — ${name}`,
      description:
        `Free 30-minute consultation.\nTopic: ${topic}\nVisitor: ${name} <${email}>` +
        (phone ? `\nPhone: ${phone}` : ""),
      startISO: start,
      endISO: end,
      attendeeEmail: email,
    });
    if (!event) {
      return NextResponse.json(
        {
          ok: false,
          error: "The calendar event could not be created. Please try again.",
        },
        { status: 503 },
      );
    }

    let emailSent = false;
    try {
      const admin = getServiceSupabase();
      const { error } = await admin.from("consultation_bookings").insert({
        name,
        email,
        phone,
        topic,
        service_slug: serviceSlug,
        scheduled_at: start,
        calendar_event_id: event.eventId,
        meet_link: event.meetLink,
        status: "booked",
        email_sent: false,
      });
      if (error) {
        if (/duplicate key|unique/i.test(error.message)) {
          await deleteCalendarEvent(event.eventId);
          return NextResponse.json(
            {
              ok: false,
              error: "That time was just taken. Please pick another slot.",
            },
            { status: 409 },
          );
        }
        throw error;
      }

      const mail = {
        name,
        email,
        phone: phone || undefined,
        topic,
        scheduledAtISO: start,
        meetLink: event.meetLink,
      };
      emailSent = (await sendBookingConfirmation(mail)).sent;
      await sendBookingAdminNotification(mail).catch(() => null);
      await admin
        .from("consultation_bookings")
        .update({ email_sent: emailSent })
        .eq("calendar_event_id", event.eventId);
    } catch (dbErr) {
      await deleteCalendarEvent(event.eventId);
      const msg = dbErr instanceof Error ? dbErr.message : "database error";
      return NextResponse.json(
        { ok: false, error: `Booking could not be saved yet: ${msg.slice(0, 120)}` },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      meetLink: event.meetLink,
      scheduledAt: start,
      emailSent,
      note: emailSent
        ? "Your consultation is booked. A calendar invitation was sent to your email."
        : "Your consultation is booked. The email confirmation is not configured yet — keep the Meet link from this page.",
    });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please try again later." },
      { status: 500 },
    );
  }
}
