// src/app/admin/audit-logs/page.tsx — NEW in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_audit-logs_page_tsx_1r94anfmv9mi0._.js`.
// Read-only list of audit_logs (newest first, 100 rows). Actor ids are
// resolved to profile full names; entity ids are truncated to 8 chars and
// the JSON details are shown truncated to 500 chars.

import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

type AuditLog = {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

export default async function AdminAuditLogs() {
  await requireAdminPage("audit:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("auditLogs", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("audit_logs")
    .select("id, actor_id, action, entity_type, entity_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const logs = (data ?? []) as AuditLog[];

  // Resolve actor ids to profile names in one query.
  const actorIds = [...new Set(logs.map((log) => String(log.actor_id)).filter(Boolean))];
  const names = new Map<string, string>();
  if (actorIds.length) {
    const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", actorIds);
    for (const profile of profiles ?? []) names.set(String(profile.id), String(profile.full_name));
  }

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("auditLogs", lang)} <span style={gold}>({logs.length})</span>
      </h1>
      <p style={muted}>{t("auditLead", lang)}</p>
      <div style={{ ...card, marginTop: 24 }}>
        {!logs.length && <p style={muted}>{t("noData", lang)}</p>}
        {logs.map((log) => (
          <div key={String(log.id)} style={row}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <strong style={{ color: "#6366F1" }}>{String(log.action)}</strong>
              <span style={muted}>{formatDate(String(log.created_at), lang)}</span>
            </div>
            <p style={{ ...muted, fontSize: 13, margin: "4px 0 0" }}>
              {String(log.entity_type)}
              {log.entity_id ? ` · ${String(log.entity_id).slice(0, 8)}…` : ""}
              {log.actor_id ? ` · ${names.get(String(log.actor_id)) ?? String(log.actor_id).slice(0, 8)}` : ""}
            </p>
            {log.details ? (
              <pre style={{ fontSize: 12, color: "#999", overflow: "auto", margin: "6px 0 0" }}>
                {JSON.stringify(log.details, null, 2).slice(0, 500)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </main>
  );
}
