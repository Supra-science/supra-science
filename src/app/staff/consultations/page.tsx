// src/app/staff/consultations/page.tsx — NEW 2026-11-20 (staff permissions build).
// Staff consultations: list + status changer (pending / scheduled /
// completed / cancelled) backed by /api/staff/consultations — audited.
// Staff may schedule and complete consultations; creating or deleting
// them stays with the customer/admin flow.

import { requireStaffPage, getServiceSupabase } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "scheduled", "completed", "cancelled"];

export default async function StaffConsultations() {
  await requireStaffPage("consultations:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("consultations", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  const { data } = await supabase
    .from("consultations")
    .select("id, message, preferred_contact, status, scheduled_at, created_at, customers(full_name, email), projects(title)")
    .order("created_at", { ascending: false })
    .limit(100);
  const consultations = data ?? [];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("consultations", lang)} <span style={{ color: "#6366F1" }}>({consultations.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!consultations.length && <p style={muted}>{t("noData", lang)}</p>}
        {consultations.map((c: Record<string, unknown>) => (
          <div key={String(c.id)} style={row}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span>
                <strong>{String((c.customers as Record<string, unknown>)?.full_name || "")}</strong>
                {String((c.projects as Record<string, unknown>)?.title || "") ? ` · ${String((c.projects as Record<string, unknown>).title)}` : ""}
              </span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={String(c.status)} lang={lang} />
                <span style={muted}>{formatDate(String(c.created_at), lang)}</span>
              </span>
            </div>
            <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>{String(c.message).slice(0, 400)}</p>
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <StatusChanger
                endpoint="/api/staff/consultations"
                id={String(c.id)}
                current={String(c.status)}
                options={STATUSES}
                labels={labels}
                applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
              />
              {c.scheduled_at ? <span style={muted}>{formatDate(String(c.scheduled_at), lang)}</span> : null}
              {c.preferred_contact ? <span style={muted}>{String(c.preferred_contact)}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
