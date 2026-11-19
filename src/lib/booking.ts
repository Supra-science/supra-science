/**
 * Consultation booking rules.
 *
 * Recovered from the live Nov-8 deployment bundle
 * (embedded `src/lib/booking.ts` module).
 *
 * Business days are Sunday–Thursday. Slots are 30 minutes,
 * 10:00–18:00 Aden time (UTC+3), bookable up to 14 days ahead,
 * with a 2-hour lead time. All dates are handled as ISO strings.
 */

/** Business weekdays (JS getUTCDay): Sunday=0 .. Thursday=4. */
const BUSINESS_WEEKDAYS = [0, 1, 2, 3, 4];

/** Length of one consultation slot in minutes. */
export const SLOT_MINUTES = 30;

export type AdenDate = { y: number; m: number; d: number; weekday: number };

/** Parse a "YYYY-MM-DD" key; returns null for invalid dates. */
export function parseDateKey(value: string): AdenDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return { y, m, d, weekday: date.getUTCDay() };
}

/** Convert a Date to its Aden-time calendar date (UTC+3). */
export function toAdenDate(date: Date): AdenDate {
  const aden = new Date(date.getTime() + 3 * 60 * 60 * 1000);
  return {
    y: aden.getUTCFullYear(),
    m: aden.getUTCMonth() + 1,
    d: aden.getUTCDate(),
    weekday: aden.getUTCDay(),
  };
}

/** Format an AdenDate as a "YYYY-MM-DD" key. */
export function adenDateKey(date: AdenDate): string {
  const m = String(date.m).padStart(2, "0");
  const d = String(date.d).padStart(2, "0");
  return `${date.y}-${m}-${d}`;
}

/** "YYYY-MM-DD" (Aden date) for an ISO timestamp. */
export function toAdenDateKey(iso: string): string | null {
  const time = Date.parse(iso);
  if (Number.isNaN(time)) return null;
  return adenDateKey(toAdenDate(new Date(time)));
}

/** Format an ISO timestamp in Aden time for the given language. */
export function formatAden(iso: string, lang: "ar" | "en"): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", {
    timeZone: "Asia/Aden",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

/** True when the date key falls on a business day (Sun–Thu). */
export function isBusinessDay(dateKey: string): boolean {
  const parsed = parseDateKey(dateKey);
  return !!parsed && BUSINESS_WEEKDAYS.includes(parsed.weekday);
}

/** True when two [start, end) ISO ranges overlap (or are unparsable). */
export function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  const a = Date.parse(startA);
  const b = Date.parse(endA);
  const c = Date.parse(startB);
  const d = Date.parse(endB);
  if (Number.isNaN(a) || Number.isNaN(b) || Number.isNaN(c) || Number.isNaN(d)) {
    return true;
  }
  return a < d && c < b;
}

/**
 * Free 30-minute slots for a date key, as ISO timestamps.
 * Empty when the day is not a business day, is in the past,
 * or is more than 14 days ahead. Slots start at 10:00 Aden
 * (07:00 UTC) and the last slot starts at 17:30 Aden.
 * Only slots at least 2 hours in the future are offered.
 */
export function daySlots(dateKey: string, now: Date = new Date()): string[] {
  const parsed = parseDateKey(dateKey);
  if (!parsed || !BUSINESS_WEEKDAYS.includes(parsed.weekday)) return [];
  const today = toAdenDate(now);
  if (dateKey < adenDateKey(today)) return [];
  const maxDate = new Date(Date.UTC(today.y, today.m - 1, today.d + 14));
  const maxKey = adenDateKey({
    y: maxDate.getUTCFullYear(),
    m: maxDate.getUTCMonth() + 1,
    d: maxDate.getUTCDate(),
    weekday: maxDate.getUTCDay(),
  });
  if (dateKey > maxKey) return [];
  const earliest = now.getTime() + 2 * 60 * 60 * 1000;
  const slots: string[] = [];
  for (let hour = 10; hour < 18; hour++) {
    for (const minute of [0, 30]) {
      const slot = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, hour - 3, minute));
      if (slot.getTime() >= earliest) slots.push(slot.toISOString());
    }
  }
  return slots;
}

export type BookingInput = {
  name?: string;
  email?: string;
  topic?: string;
  phone?: string;
  start?: string;
};

/**
 * Validate a booking request. Returns an English error message
 * or null when the input is valid.
 */
export function validateBooking(input: BookingInput): string | null {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();
  const topic = String(input.topic ?? "").trim();
  const phone = String(input.phone ?? "").trim();
  const start = String(input.start ?? "").trim();
  if (name.length < 2 || name.length > 120) return "Name must be 2–120 characters.";
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email)) {
    return "Please provide a valid email address.";
  }
  if (topic.length < 2 || topic.length > 120) return "Topic must be 2–120 characters.";
  if (phone.length > 40) return "Phone number is too long.";
  if (Number.isNaN(Date.parse(start))) return "Please choose a valid time slot.";
  return null;
}

/**
 * Aliases for the API routes.
 *
 * The live bundle minifies export names to single letters, so the
 * original export names are unrecoverable. The booking routes were
 * reconstructed with these descriptive names; they alias the recovered
 * implementations above (parseDateKey, isBusinessDay, daySlots,
 * rangesOverlap, toAdenDateKey).
 */
export const parseDate = parseDateKey;
export const isWorkingDay = isBusinessDay;
export const generateSlots = daySlots;
export const slotsOverlap = rangesOverlap;
export const adenDateOf = toAdenDateKey;
