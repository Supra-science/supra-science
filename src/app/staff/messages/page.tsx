// src/app/staff/messages/page.tsx — NEW 2026-11-20 (staff permissions build).
// Staff contact messages: list + status changer (new / read / replied /
// archived) backed by /api/staff/messages — audited. Marking "replied"
// records that the reply went out (by email/WhatsApp); the page sends
// nothing itself.

import { requireStaffPage } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "read", "replied", "archived"];

export default async function StaffMessages() {
  // Phase 2 (2026-11-20): reads use the caller\'s own session — RLS (migration 010) enforces the boundaries.
  const { supabase } = await requireStaffPage("messages:read");
  const lang = await getLang();

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, preferred_contact, status, email_sent, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const messages = data ?? [];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("messages", lang)} <span style={{ color: "#6366F1" }}>({messages.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!messages.length && <p style={muted}>{t("noData", lang)}</p>}
        {messages.map((m: Record<string, unknown>) => (
          <div key={String(m.id)} style={row}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                <strong>{String(m.name)}</strong>
                {m.subject ? ` · ${String(m.subject)}` : ""} · {String(m.email)}
                {m.phone ? ` · ${String(m.phone)}` : ""}
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={String(m.status)} lang={lang} />
                <span style={muted}>{formatDate(String(m.created_at), lang)}</span>
              </span>
            </div>
            <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>{String(m.message).slice(0, 600)}</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <StatusChanger
                endpoint="/api/staff/messages"
                id={String(m.id)}
                current={String(m.status)}
                options={STATUSES}
                labels={labels}
                applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
              />
              {m.preferred_contact ? <span style={muted}>{String(m.preferred_contact)}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
