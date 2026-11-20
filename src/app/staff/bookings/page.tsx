// src/app/staff/bookings/page.tsx — NEW 2026-11-20 (staff permissions build).
// Staff bookings: READ-ONLY. Bookings are calendar-driven (Meet links,
// calendar events); changing them stays admin-only, so there is
// deliberately no StatusChanger and no /api/staff/bookings route.

import { requireStaffPage } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate } from "@/lib/i18n";
import { page, heading, card, row, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function StaffBookings() {
  // Phase 2 (2026-11-20): reads use the caller\'s own session — RLS (migration 010) enforces the boundaries.
  const { supabase } = await requireStaffPage("bookings:read");
  const lang = await getLang();

  const { data } = await supabase
    .from("consultation_bookings")
    .select("id, name, email, phone, topic, service_slug, scheduled_at, calendar_event_id, meet_link, status, email_sent, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const bookings = data ?? [];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("bookings", lang)} <span style={{ color: "#6366F1" }}>({bookings.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!bookings.length && <p style={muted}>{t("noData", lang)}</p>}
        {bookings.map((b: Record<string, unknown>) => (
          <div key={String(b.id)} style={row}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                <strong>{String(b.name)}</strong>
                {b.topic ? ` · ${String(b.topic)}` : ""} · {String(b.email)}
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={String(b.status)} lang={lang} />
                <span style={muted}>{formatDate(String(b.created_at), lang)}</span>
              </span>
            </div>
            {b.scheduled_at ? <p style={{ margin: "8px 0 0" }}>{formatDate(String(b.scheduled_at), lang)}</p> : null}
            {b.meet_link ? (
              <p style={{ margin: "4px 0 0" }}>
                <a href={String(b.meet_link)} target="_blank" rel="noreferrer" style={{ color: "#6366F1" }}>
                  {String(b.meet_link)}
                </a>
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
