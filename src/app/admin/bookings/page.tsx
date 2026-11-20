// src/app/admin/bookings/page.tsx — NEW in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_bookings_page_tsx_0vwc5mekwy7h7._.js`.
// Lists consultation bookings ordered by scheduled time; each row shows the
// booking, its Google Meet link, whether the confirmation email was sent,
// and a StatusChanger (booked / cancelled / completed).

import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel, type Lang } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["booked", "cancelled", "completed"];

type Booking = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  topic: string;
  service_slug: string | null;
  scheduled_at: string | null;
  calendar_event_id: string | null;
  meet_link: string | null;
  status: string;
  email_sent: boolean | null;
  created_at: string;
};

function formatScheduledAt(value: string, lang: Lang): string {
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) return value;
  return new Intl.DateTimeFormat(lang === "ar" ? "ar" : "en-GB", {
    timeZone: "Asia/Aden",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(parsed));
}

export default async function AdminBookings() {
  await requireAdminPage("bookings:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("bookings", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("consultation_bookings")
    .select("id, name, email, phone, topic, service_slug, scheduled_at, calendar_event_id, meet_link, status, email_sent, created_at")
    .order("scheduled_at", { ascending: true })
    .limit(100);
  const bookings = (data ?? []) as Booking[];

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("bookings", lang)} <span style={gold}>({bookings.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!bookings.length && <p style={muted}>{t("noData", lang)}</p>}
        {bookings.map((booking) => (
          <div key={String(booking.id)} style={row}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                <strong>{String(booking.name || "")}</strong>
                {booking.email && (
                  <span style={{ ...muted, fontSize: 13 }}> · {String(booking.email)}</span>
                )}
                {booking.phone && (
                  <span style={{ ...muted, fontSize: 13 }}> · {String(booking.phone)}</span>
                )}
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={String(booking.status)} lang={lang} />
                <span style={muted}>{formatDate(String(booking.created_at), lang)}</span>
              </span>
            </div>
            <p style={{ margin: "8px 0" }}>
              <strong>{String(booking.topic)}</strong>
              {booking.scheduled_at && (
                <span style={{ ...muted, fontSize: 13 }}>
                  {" · "}
                  {formatScheduledAt(String(booking.scheduled_at), lang)} (Aden)
                </span>
              )}
            </p>
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
              {booking.meet_link && (
                <a href={String(booking.meet_link)} target="_blank" rel="noreferrer" style={{ color: "#6366F1" }}>
                  Google Meet ↗
                </a>
              )}
              <span style={muted}>
                {lang === "ar" ? "تأكيد البريد" : "Email confirmation"}: {booking.email_sent ? "✓" : "—"}
              </span>
              <StatusChanger
                endpoint="/api/admin/bookings"
                id={String(booking.id)}
                current={String(booking.status)}
                options={STATUSES}
                labels={labels}
                applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
              />
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
