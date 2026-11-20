// src/app/admin/users/page.tsx — NEW in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_users_page_tsx_085751vbr95_b._.js`.
// Lists profiles (newest first, 200) joined to user_roles (500). Each row
// shows the name, a truncated id, the join date and a role badge; for every
// user except the signed-in admin it offers one AdminActionButton per other
// role ("Change role: <role>") PATCHing /api/admin/users. The "(you)" marker
// identifies the signed-in admin.
//
// Contact details (email from Auth, phone/company/country from the
// customers row) are shown ONLY to the platform owner — permission
// `contacts:read`, owner-only. Admins and staff see no contact
// line here; the admin keeps the customer contact view on
// /admin/customers exactly as before.

import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { hasPermission } from "@/lib/permissions";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, roleLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { AdminActionButton, DeleteUserButton } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const ROLES = ["admin", "staff", "customer"];

export default async function AdminUsers() {
  const { user, supabase: sessionSupabase } = await requireAdminPage("users:manage");
  const lang = await getLang();
  const supabase = getServiceSupabase();
  // Only the owner sees the transfer-ownership button (permission
  // `owner:access` — the admin wildcard does not include it).
  const isOwner = await hasPermission(sessionSupabase, user, "owner:access");
  // Only the owner sees contact details on this page (permission
  // `contacts:read` — owner-only, migration 014 draft).
  const canViewContact = await hasPermission(sessionSupabase, user, "contacts:read");

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("users", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const [{ data: profiles }, { data: roles }, { data: customerRows }, authUsers] = await Promise.all([
    supabase.from("profiles").select("id, full_name, created_at").order("created_at", { ascending: false }).limit(200),
    supabase.from("user_roles").select("user_id, role, suspended_at").limit(500),
    supabase.from("customers").select("user_id, email, phone, company, country").limit(500),
    // Auth emails are not in profiles — the service client reads them
    // from Auth. A failure here must never break the page: the contact
    // line simply shows what is available.
    supabase.auth.admin.listUsers({ page: 1, perPage: 200 }),
  ]);
  const roleByUser = new Map<string, string>();
  const suspendedByUser = new Map<string, boolean>();
  for (const role of roles ?? []) {
    roleByUser.set(String(role.user_id), String(role.role));
    suspendedByUser.set(String(role.user_id), (role as { suspended_at?: string | null }).suspended_at != null);
  }
  const emailByUser = new Map<string, string>();
  for (const u of authUsers.data?.users ?? []) {
    if (u.email) emailByUser.set(String(u.id), String(u.email));
  }
  type ContactRow = { email: string | null; phone: string | null; company: string | null; country: string | null };
  const contactByUser = new Map<string, ContactRow>();
  for (const c of (customerRows ?? []) as ({ user_id: string } & ContactRow)[]) {
    contactByUser.set(String(c.user_id), { email: c.email, phone: c.phone, company: c.company, country: c.country });
  }

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
          const isSuspended = suspendedByUser.get(String(profile.id)) ?? false;
          const isSelf = String(profile.id) === user.id;
          // Owner-only contact line: Auth email first, then the business
          // contact record (phone, company, country; its email only when
          // it differs from the Auth email). Empty for admins.
          const contact = contactByUser.get(String(profile.id));
          const contactParts = canViewContact
            ? [
                emailByUser.get(String(profile.id)) ?? null,
                contact?.email && contact.email !== emailByUser.get(String(profile.id)) ? contact.email : null,
                contact?.phone ?? null,
                contact?.company ?? null,
                contact?.country ?? null,
              ].filter((v): v is string => v != null && v !== "")
            : [];
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
                {contactParts.length > 0 && (
                  <>
                    <br />
                    <span style={{ ...muted, fontSize: 13 }}>{contactParts.join(" · ")}</span>
                  </>
                )}
              </div>
              <span style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 12,
                    padding: "2px 10px",
                    borderRadius: 10,
                    background: role === "owner" ? "#0B132B" : role === "admin" ? "#fef3c7" : "#e5e7eb",
                    color: role === "owner" ? "#FFD700" : role === "admin" ? "#6366F1" : "#39404d",
                  }}
                >
                  {roleLabel(role, lang)}
                </span>
                {isSuspended && (
                  <span
                    style={{
                      fontSize: 12,
                      padding: "2px 10px",
                      borderRadius: 10,
                      background: "#fee2e2",
                      color: "#dc2626",
                    }}
                  >
                    {t("suspended", lang)}
                  </span>
                )}
                {!isSelf &&
                  role !== "owner" &&
                  ROLES.filter((r) => r !== role).map((r) => (
                    <AdminActionButton
                      key={r}
                      endpoint="/api/admin/users"
                      payload={{ user_id: String(profile.id), role: r }}
                      label={`${t("changeRole", lang)}: ${roleLabel(r, lang)}`}
                    />
                  ))}
                {!isSelf && role !== "owner" && (
                  <AdminActionButton
                    endpoint={isSuspended ? "/api/admin/users/unsuspend" : "/api/admin/users/suspend"}
                    method="POST"
                    payload={{ user_id: String(profile.id) }}
                    label={isSuspended ? t("unsuspendUser", lang) : t("suspendUser", lang)}
                    confirmText={
                      lang === "ar"
                        ? isSuspended
                          ? `إلغاء تعليق ${String(profile.full_name || profile.id)}؟ سيستطيع الدخول مجدداً فوراً.`
                          : `تعليق حساب ${String(profile.full_name || profile.id)}؟ لن يستطيع الدخول فوراً، ويمكن إلغاء التعليق في أي وقت.`
                        : isSuspended
                          ? `Unsuspend ${String(profile.full_name || profile.id)}? They will be able to sign in again immediately.`
                          : `Suspend ${String(profile.full_name || profile.id)}? They will be blocked from signing in immediately, and the suspension can be lifted at any time.`
                    }
                  />
                )}
                {isOwner && !isSelf && role === "admin" && (
                  <AdminActionButton
                    endpoint="/api/admin/users/transfer-owner"
                    method="POST"
                    payload={{ user_id: String(profile.id) }}
                    label={t("transferOwner", lang)}
                    confirmText={
                      lang === "ar"
                        ? `نقل ملكية المنصة إلى ${String(profile.full_name || profile.id)}؟ ستصبح أنت مديراً، وسيصبح هو المالك الوحيد. يمكنه نقلها إليك مجدداً بالطريقة نفسها.`
                        : `Transfer platform ownership to ${String(profile.full_name || profile.id)}? You will become an administrator and they will become the sole owner. They can transfer it back the same way.`
                    }
                  />
                )}
                {!isSelf && role !== "owner" && (
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
