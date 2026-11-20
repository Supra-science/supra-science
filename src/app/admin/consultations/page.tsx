// src/app/admin/consultations/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_consultations_page_tsx_0gjtiawiu1_2t._.js`.
// Nov-5 version was a redirect-auth page selecting "*"; the live version
// uses requireAdminPage + getServiceSupabase + i18n, selects explicit
// columns with customers/projects joins, and adds a StatusChanger
// (pending / scheduled / completed / cancelled) backed by
// /api/admin/consultations.

import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "scheduled", "completed", "cancelled"];

type Consultation = {
  id: string;
  message: string;
  preferred_contact: string | null;
  status: string;
  scheduled_at: string | null;
  created_at: string;
  customers?: { full_name?: string | null; email?: string | null } | null;
  projects?: { title?: string | null } | null;
};

export default async function AdminConsultations() {
  await requireAdminPage("consultations:read");
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

  const { data } = await supabase
    .from("consultations")
    .select("id, message, preferred_contact, status, scheduled_at, created_at, customers(full_name, email), projects(title)")
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as Consultation[];

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("consultations", lang)} <span style={gold}>({items.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!items.length && <p style={muted}>{t("noData", lang)}</p>}
        {items.map((item) => {
          const customer = item.customers ?? {};
          const project = item.projects ?? {};
          return (
            <div key={String(item.id)} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <span>
                  <strong>{String(customer.full_name || "")}</strong>
                  {customer.email && <span style={{ ...muted, fontSize: 13 }}> · {String(customer.email)}</span>}
                  {project.title && <span style={{ ...muted, fontSize: 13 }}> · {String(project.title)}</span>}
                </span>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <StatusBadge status={String(item.status)} lang={lang} />
                  <span style={muted}>{formatDate(String(item.created_at), lang)}</span>
                </span>
              </div>
              <p style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>{String(item.message)}</p>
              <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", fontSize: 13 }}>
                {item.preferred_contact ? (
                  <span style={muted}>
                    {t("preferredContact", lang)}: {String(item.preferred_contact)}
                  </span>
                ) : null}
                {item.scheduled_at ? (
                  <span style={muted}>
                    {t("scheduledAt", lang)}: {formatDate(String(item.scheduled_at), lang)}
                  </span>
                ) : null}
                <StatusChanger
                  endpoint="/api/admin/consultations"
                  id={String(item.id)}
                  current={String(item.status)}
                  options={STATUSES}
                  labels={labels}
                  applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
                />
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
