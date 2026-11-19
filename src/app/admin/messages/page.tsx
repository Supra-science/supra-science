// src/app/admin/messages/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_messages_page_tsx_0rt_i0vic61d5._.js`.
// Nov-5 version was a redirect-auth page selecting "*"; the live version
// uses requireAdminPage + getServiceSupabase + i18n, selects explicit
// columns (including phone, preferred_contact, email_sent), and adds a
// StatusChanger (new / read / replied / archived) backed by
// /api/admin/messages.

import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new", "read", "replied", "archived"];

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  preferred_contact: string | null;
  status: string;
  email_sent: boolean | null;
  created_at: string;
};

export default async function AdminMessages() {
  await requireAdminPage();
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("messages", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, preferred_contact, status, email_sent, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as ContactMessage[];

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("messages", lang)} <span style={gold}>({items.length})</span>
      </h1>
      <p style={muted}>{t("messagesLead", lang)}</p>
      <div style={{ ...card, marginTop: 24 }}>
        {!items.length && <p style={muted}>{t("noData", lang)}</p>}
        {items.map((item) => (
          <div key={String(item.id)} style={row}>
            <div style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}>
              <strong>{String(item.name)}</strong>
              <a href={`mailto:${String(item.email)}`} style={gold}>
                {String(item.email)}
              </a>
              {item.phone ? <span style={muted}>{String(item.phone)}</span> : null}
              <StatusBadge status={String(item.status)} lang={lang} />
              {item.email_sent ? (
                <span style={{ fontSize: 11, color: "#7a7" }}>✉ {t("emailed", lang)}</span>
              ) : (
                <span style={{ fontSize: 11, color: "#a77" }}>✉ {t("notEmailed", lang)}</span>
              )}
              <span style={muted}>{formatDate(String(item.created_at), lang)}</span>
            </div>
            <div style={{ color: "#6366F1", fontSize: 13, marginTop: 4 }}>{String(item.subject)}</div>
            <p style={{ fontSize: 13, color: "#39404d", marginTop: 4, whiteSpace: "pre-wrap" }}>
              {String(item.message).slice(0, 600)}
            </p>
            <div style={{ marginTop: 8 }}>
              <StatusChanger
                endpoint="/api/admin/messages"
                id={String(item.id)}
                current={String(item.status)}
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
