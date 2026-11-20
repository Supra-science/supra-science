// src/app/admin/users/page.tsx — NEW in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_users_page_tsx_085751vbr95_b._.js`.
// Lists profiles (newest first, 200) joined to user_roles (500). Each row
// shows the name, a truncated id, the join date and a role badge; for every
// user except the signed-in admin it offers one AdminActionButton per other
// role ("Change role: <role>") PATCHing /api/admin/users. The "(you)" marker
// identifies the signed-in admin.

import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, roleLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { AdminActionButton, DeleteUserButton } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "staff", "customer"];

export default async function AdminUsers() {
  const { user } = await requireAdminPage("users:manage");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("users", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const [{ data: profiles }, { data: roles }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("user_roles").select("user_id, role").limit(500),
  ]);
  const roleByUser = new Map<string, string>();
  for (const role of roles ?? []) roleByUser.set(String(role.user_id), String(role.role));

  const users = (profiles ?? []) as { id: string; full_name: string | null; created_at: string }[];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("users", lang)} <span style={gold}>({users.length})</span>
      </h1>
      <p style={muted}>{t("usersLead", lang)}</p>
      <div style={{ ...card, marginTop: 24 }}>
        {!users.length && <p style={muted}>{t("noData", lang)}</p>}
        {users.map((profile) => {
          const role = roleByUser.get(String(profile.id)) ?? "customer";
          const isSelf = String(profile.id) === user.id;
          return (
            <div
              key={String(profile.id)}
              style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}
            >
              <div>
                <strong>{String(profile.full_name || "—")}</strong>
                {isSelf ? (
                  <span style={{ ...gold, fontSize: 12 }}> · {lang === "ar" ? "(أنت)" : "(you)"}</span>
                ) : null}
                <br />
                <span style={{ ...muted, fontSize: 13 }}>
                  {String(profile.id).slice(0, 8)}… · {formatDate(String(profile.created_at), lang)}
                </span>
              </div>
              <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 10,
                    background: role === "admin" ? "#fef3c7" : "#e5e7eb",
                    color: role === "admin" ? "#6366F1" : "#39404d",
                  }}
                >
                  {roleLabel(role, lang)}
                </span>
                {!isSelf &&
                  ROLES.filter((r) => r !== role).map((r) => (
                    <AdminActionButton
                      key={r}
                      endpoint="/api/admin/users"
                      payload={{ user_id: String(profile.id), role: r }}
                      label={`${t("changeRole", lang)}: ${roleLabel(r, lang)}`}
                    />
                  ))}
                {!isSelf && (
                  <DeleteUserButton
                    endpoint="/api/admin/users"
                    userId={String(profile.id)}
                    label={t("deleteUser", lang)}
                    confirmText={
                      lang === "ar"
                        ? `إزالة ${String(profile.full_name || profile.id)} نهائياً؟ سيُحذف حسابه وملفه ودوره. لا يمكن التراجع عن هذا.`
                        : `Remove ${String(profile.full_name || profile.id)} permanently? Their account, profile and role will be deleted. This cannot be undone.`
                    }
                  />
                )}
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
