/**
 * Transactional email for Supra-Science — zero-cost path.
 *
 * Strategy (Nov-8): Gmail API with an OAuth2 refresh token
 * (free, no card, no subscription). Proton Mail free has no SMTP/API,
 * so Gmail is the sender transport while Supra-science@proton.me
 * stays the official business inbox (notifications are delivered
 * there). The Nov-5 SMTP/App-Password transport was replaced;
 * nodemailer is no longer a dependency.
 *
 * Required server-only env vars (never expose to client):
 *   GMAIL_CLIENT_ID          — Google OAuth client id
 *   GMAIL_CLIENT_SECRET      — Google OAuth client secret
 *   GMAIL_REFRESH_TOKEN      — OAuth refresh token for the sender Gmail
 *   GMAIL_SENDER             — sender Gmail address (optional)
 *
 * If the vars are missing, sending is skipped gracefully and the caller
 * is told why — the contact message is still saved to Supabase.
 */

import { formatAden } from "@/lib/booking";

export const BUSINESS_EMAIL = "Supra-science@proton.me";
export const SENDER_NAME = "Supra-Science | D. Faisal Alradaei";
/** Default sender Gmail address when GMAIL_SENDER is not set. */
const DEFAULT_SENDER = "goodyour583@gmail.com";
const GMAIL_SEND_URL = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

export interface ContactNotification {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  preferredContact: string;
}

export interface BookingEmail {
  name: string;
  email: string;
  phone?: string;
  topic: string;
  scheduledAtISO: string;
  meetLink?: string | null;
}

export interface SendResult {
  sent: boolean;
  reason?: string;
}

type CachedToken = { value: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function base64url(input: string): string {
  return Buffer.from(input, "utf-8").toString("base64url");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** RFC 2047-encode a header value when it contains non-ASCII text. */
function encodeHeader(value: string): string {
  return /^[\x00-\x7F]*$/.test(value)
    ? value
    : `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

async function getAccessToken(): Promise<string | null> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }
  const clientId = process.env.GMAIL_CLIENT_ID;
  const clientSecret = process.env.GMAIL_CLIENT_SECRET;
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN;
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
    console.error("[email] token mint failed:", res.status, text.slice(0, 200));
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

/** Build a multipart/alternative MIME message and base64url-encode it. */
function buildMime(input: {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  html: string;
}): string {
  const sender = process.env.GMAIL_SENDER || DEFAULT_SENDER;
  const boundary = "supra-science-boundary";
  return base64url(
    [
      `From: "${SENDER_NAME}" <${sender}>`,
      `To: ${input.to}`,
      ...(input.replyTo ? [`Reply-To: ${input.replyTo}`] : []),
      `Subject: ${encodeHeader(input.subject)}`,
      "MIME-Version: 1.0",
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      "",
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      input.text,
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: 8bit",
      "",
      input.html,
      `--${boundary}--`,
      "",
    ].join("\r\n")
  );
}

async function sendRawMime(raw: string): Promise<SendResult> {
  const token = await getAccessToken();
  if (!token) return { sent: false, reason: "gmail_not_configured" };
  try {
    const res = await fetch(GMAIL_SEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[email] gmail send failed:", res.status, text.slice(0, 200));
      return { sent: false, reason: "send_failed" };
    }
    return { sent: true };
  } catch (err) {
    console.error(
      "[email] gmail send failed:",
      err instanceof Error ? err.message.slice(0, 200) : "unknown"
    );
    return { sent: false, reason: "send_failed" };
  }
}

/**
 * Notify the business inbox about a new website contact message.
 * Never throws — returns { sent:false, reason } on any failure.
 */
export async function sendContactNotification(
  c: ContactNotification
): Promise<SendResult> {
  const subject = `[Website] ${c.subject} — ${c.name}`;
  const text =
    `New contact message from the Supra-Science website\n` +
    `------------------------------------------------\n` +
    `Name: ${c.name}\n` +
    `Email: ${c.email}\n` +
    `Phone: ${c.phone || "—"}\n` +
    `Preferred contact: ${c.preferredContact}\n` +
    `Subject: ${c.subject}\n\n` +
    `${c.message}\n` +
    `------------------------------------------------\n` +
    `Reply directly to this email to answer ${c.name}.`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#0B132B">New website inquiry — Supra-Science</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><td><b>Name</b></td><td>${escapeHtml(c.name)}</td></tr>
        <tr><td><b>Email</b></td><td>${escapeHtml(c.email)}</td></tr>
        <tr><td><b>Phone</b></td><td>${escapeHtml(c.phone || "—")}</td></tr>
        <tr><td><b>Preferred contact</b></td><td>${escapeHtml(c.preferredContact)}</td></tr>
        <tr><td><b>Subject</b></td><td>${escapeHtml(c.subject)}</td></tr>
      </table>
      <p style="background:#F8FAFC;padding:12px;border-left:3px solid #0B132B">${escapeHtml(c.message).replace(/\n/g, "<br/>")}</p>
    </div>`;

  try {
    return await sendRawMime(
      buildMime({ to: BUSINESS_EMAIL, replyTo: c.email, subject, text, html })
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[email] contact notification failed:", msg.slice(0, 200));
    return { sent: false, reason: "send_failed" };
  }
}

/** Confirm a consultation booking to the client by email. */
export async function sendBookingConfirmationToClient(
  b: BookingEmail
): Promise<SendResult> {
  const when = formatAden(b.scheduledAtISO, "en");
  const subject = `Your Supra-Science consultation is booked — ${when}`;
  const text = `Hello ${b.name},

Your free 30-minute consultation with Supra-Science is booked.

When: ${when} (Aden time, UTC+3)
Topic: ${b.topic}
Google Meet: ${b.meetLink ?? "the link will follow by email"}

A calendar invitation was sent to this email address. To reschedule or
cancel, just reply to this email.

— Supra-Science`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#0B132B">Your consultation is booked — Supra-Science</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><td><b>When</b></td><td>${escapeHtml(when)} (Aden time, UTC+3)</td></tr>
        <tr><td><b>Topic</b></td><td>${escapeHtml(b.topic)}</td></tr>
        <tr><td><b>Google Meet</b></td><td>${b.meetLink ? `<a href="${escapeHtml(b.meetLink)}">Join the meeting</a>` : "the link will follow by email"}</td></tr>
      </table>
      <p>A calendar invitation was sent to this email address. To reschedule or cancel, just reply to this email.</p>
    </div>`;
  return sendRawMime(buildMime({ to: b.email, subject, text, html }));
}

/** Notify the business inbox about a new consultation booking. */
export async function sendBookingNotificationToTeam(
  b: BookingEmail
): Promise<SendResult> {
  const when = formatAden(b.scheduledAtISO, "en");
  const subject = `[Website] New consultation booking — ${b.name}`;
  const text = `New consultation booking from the Supra-Science website
------------------------------------------------
Name: ${b.name}
Email: ${b.email}
Phone: ${b.phone || "—"}
When: ${when} (Aden time, UTC+3)
Topic: ${b.topic}
Google Meet: ${b.meetLink ?? "—"}
------------------------------------------------
The event is on your Google Calendar. Reply directly to this email to answer ${b.name}.`;
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px">
      <h2 style="color:#0B132B">New consultation booking — Supra-Science</h2>
      <table cellpadding="6" cellspacing="0" style="border-collapse:collapse">
        <tr><td><b>Name</b></td><td>${escapeHtml(b.name)}</td></tr>
        <tr><td><b>Email</b></td><td>${escapeHtml(b.email)}</td></tr>
        <tr><td><b>Phone</b></td><td>${escapeHtml(b.phone || "—")}</td></tr>
        <tr><td><b>When</b></td><td>${escapeHtml(when)} (Aden time, UTC+3)</td></tr>
        <tr><td><b>Topic</b></td><td>${escapeHtml(b.topic)}</td></tr>
        <tr><td><b>Google Meet</b></td><td>${b.meetLink ? `<a href="${escapeHtml(b.meetLink)}">Join the meeting</a>` : "—"}</td></tr>
      </table>
    </div>`;
  return sendRawMime(
    buildMime({ to: BUSINESS_EMAIL, replyTo: b.email, subject, text, html })
  );
}

/** Validate a contact payload. Returns an error string or null. */
export function validateContact(input: {
  name?: unknown;
  email?: unknown;
  subject?: unknown;
  message?: unknown;
}): string | null {
  const name = String(input.name ?? "").trim();
  const email = String(input.email ?? "").trim();
  const subject = String(input.subject ?? "").trim();
  const message = String(input.message ?? "").trim();
  if (name.length < 2 || name.length > 120) return "Name must be 2–120 characters.";
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email))
    return "Please provide a valid email address.";
  if (subject.length < 3 || subject.length > 200)
    return "Subject must be 3–200 characters.";
  if (message.length < 10 || message.length > 5000)
    return "Message must be 10–5000 characters.";
  return null;
}

/**
 * Aliases for the booking routes. The live bundle minifies export names
 * to single letters; the routes were reconstructed with these
 * descriptive names, aliasing the recovered implementations above.
 */
export const sendBookingConfirmation = sendBookingConfirmationToClient;
export const sendBookingAdminNotification = sendBookingNotificationToTeam;
