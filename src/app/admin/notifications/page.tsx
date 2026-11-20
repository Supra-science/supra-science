// src/app/admin/notifications/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_notifications_page_tsx_11kbqmg64g_te._.js`.
// Nov-5 version was a redirect-auth page selecting "*"; the live version
// uses requireAdminPage + getServiceSupabase + i18n, selects explicit
// columns with a customers join, shows a Read/Unread pill, and offers a
// "Mark read" AdminActionButton (PATCH { id, is_read: true } to
// /api/admin/notifications) on unread rows only.

import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { AdminActionButton } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  is_read: boolean | null;
  created_at: string;
  customers?: { full_name?: string | null } | null;
};

export default async function AdminNotifications() {
  await requireAdminPage("notifications:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("notifications", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, message, is_read, created_at, customers(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as Notification[];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("notifications", lang)} <span style={gold}>({items.length})</span>
      </h1>
      <p style={muted}>{t("notificationsLead", lang)}</p>
      <div style={{ ...card, marginTop: 24 }}>
        {!items.length && <p style={muted}>{t("noData", lang)}</p>}
        {items.map((item) => {
          const customer = item.customers ?? {};
          return (
            <div key={String(item.id)} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <strong>{String(item.title)}</strong>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 8,
                      background: item.is_read ? "#E2E8F0" : "#6366F1",
                      color: item.is_read ? "#39404d" : "#000",
                    }}
                  >
                    {item.is_read ? t("read", lang) : t("unread", lang)}
                  </span>
                  {!item.is_read && (
                    <AdminActionButton
                      endpoint="/api/admin/notifications"
                      payload={{ id: String(item.id), is_read: true }}
                      label={t("markRead", lang)}
                    />
                  )}
                </span>
              </div>
              <p style={{ color: "#39404d", fontSize: 14, margin: "4px 0" }}>{String(item.message)}</p>
              <p style={{ ...muted, fontSize: 12 }}>
                {String(item.type)}
                {customer.full_name ? ` · ${String(customer.full_name)}` : ""} · {formatDate(String(item.created_at), lang)}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
