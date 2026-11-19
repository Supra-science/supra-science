/**
 * Google Calendar integration for consultation bookings.
 *
 * Recovered from the live Nov-8 deployment bundle
 * (embedded `src/lib/calendar.ts` module).
 *
 * Uses a service OAuth client (client ID + client secret + refresh
 * token) to mint access tokens, list events on the primary calendar,
 * create events with a Google Meet link, and delete events.
 * All times use the Asia/Aden time zone.
 */

const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const CALENDAR_ID = "primary";
const TIME_ZONE = "Asia/Aden";

type CachedToken = { value: string; expiresAt: number };

let cachedToken: CachedToken | null = null;

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_CALENDAR_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("[calendar] token mint failed:", res.status, text.slice(0, 200));
    return null;
  }
  const data = await res.json();
  if (!data.access_token) return null;
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return data.access_token;
}

export type CalendarBusySpan = { start: string; end: string };

/** List events on the primary calendar between two ISO timestamps. */
export async function listEvents(
  startISO: string,
  endISO: string
): Promise<CalendarBusySpan[] | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    let pageToken: string | undefined;
    const spans: CalendarBusySpan[] = [];
    for (let page = 0; page < 5; page++) {
      const url = new URL(`${CALENDAR_API}/calendars/${CALENDAR_ID}/events`);
      url.searchParams.set("timeMin", startISO);
      url.searchParams.set("timeMax", endISO);
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");
      url.searchParams.set("maxResults", "250");
      if (pageToken) url.searchParams.set("pageToken", pageToken);
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("[calendar] events list failed:", res.status, text.slice(0, 200));
        return null;
      }
      const data = await res.json();
      for (const item of data.items ?? []) {
        const start =
          item.start?.dateTime ??
          (item.start?.date ? `${item.start.date}T00:00:00Z` : null);
        const end =
          item.end?.dateTime ?? (item.end?.date ? `${item.end.date}T00:00:00Z` : null);
        if (start && end) spans.push({ start, end });
      }
      if (!(pageToken = data.nextPageToken)) break;
    }
    return spans;
  } catch (err) {
    console.error(
      "[calendar] events list error:",
      (err instanceof Error ? err.message : "unknown").slice(0, 200)
    );
    return null;
  }
}

export type CreateEventInput = {
  summary: string;
  description: string;
  startISO: string;
  endISO: string;
  attendeeEmail: string;
};

/**
 * Create a calendar event with a Google Meet link and send the
 * invitation to the attendee. Returns the event id and Meet link.
 */
export async function createEvent(
  input: CreateEventInput
): Promise<{ eventId: string; meetLink: string | null } | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `booking-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    const url = new URL(`${CALENDAR_API}/calendars/${CALENDAR_ID}/events`);
    url.searchParams.set("conferenceDataVersion", "1");
    url.searchParams.set("sendUpdates", "all");
    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: input.summary,
        description: input.description,
        start: { dateTime: input.startISO, timeZone: TIME_ZONE },
        end: { dateTime: input.endISO, timeZone: TIME_ZONE },
        attendees: [{ email: input.attendeeEmail }],
        conferenceData: {
          createRequest: {
            requestId,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[calendar] event create failed:", res.status, text.slice(0, 200));
      return null;
    }
    const data = await res.json();
    return data.id ? { eventId: data.id, meetLink: data.hangoutLink ?? null } : null;
  } catch (err) {
    console.error(
      "[calendar] event create error:",
      (err instanceof Error ? err.message : "unknown").slice(0, 200)
    );
    return null;
  }
}

/** Delete a calendar event (a 404 counts as already deleted). */
export async function deleteEvent(eventId: string): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return false;
  try {
    const url = new URL(
      `${CALENDAR_API}/calendars/${CALENDAR_ID}/events/${encodeURIComponent(eventId)}`
    );
    url.searchParams.set("sendUpdates", "all");
    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 404) {
      const text = await res.text().catch(() => "");
      console.error("[calendar] event delete failed:", res.status, text.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.error(
      "[calendar] event delete error:",
      (err instanceof Error ? err.message : "unknown").slice(0, 200)
    );
    return false;
  }
}

/** True when all three Google Calendar OAuth variables are set. */
export function isCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CALENDAR_CLIENT_ID &&
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET &&
    process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
  );
}

/**
 * Aliases for the booking routes. The live bundle minifies export names
 * to single letters; the routes were reconstructed with these
 * descriptive names, aliasing the recovered implementations above.
 */
export const listCalendarEvents = listEvents;
export const createCalendarEvent = createEvent;
export const deleteCalendarEvent = deleteEvent;
// Added 2026-11-09 during build & test: the admin bookings route imports
// `cancelCalendarEvent` (name reconstructed from the minified export "s");
// it is the same deleteEvent implementation (DELETE the event, false on
// failure, 404 counts as success). Without this alias `next build` fails.
export const cancelCalendarEvent = deleteEvent;
