// src/app/staff/page.tsx — NEW 2026-11-20 (staff permissions build).
// Staff overview: operational counts only — open projects, new contact
// messages, pending consultations, registered customers. No financial
// figures (no invoices/payments) by design.

import Link from "next/link";
import { requireStaffPage, getServiceSupabase } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { page, heading, card, muted } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

export default async function StaffOverview() {
  await requireStaffPage("staff:access");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("staffWorkspace", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const [{ count: openProjects }, { count: newMessages }, { count: pendingConsultations }, { count: customers }] =
    await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }).not("status", "in", '("completed","cancelled")'),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "new"),
      supabase.from("consultations").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("customers").select("id", { count: "exact", head: true }),
    ]);

  const tiles = [
    { label: t("projects", lang), value: openProjects ?? 0, href: "/staff/projects" },
    { label: t("messages", lang), value: newMessages ?? 0, href: "/staff/messages" },
    { label: t("consultations", lang), value: pendingConsultations ?? 0, href: "/staff/consultations" },
    { label: t("customers", lang), value: customers ?? 0, href: "/staff/customers" },
  ];

  return (
    <main style={page}>
      <h1 style={heading}>{t("staffWorkspace", lang)}</h1>
      <p style={muted}>{t("staffLead", lang)}</p>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 24 }}>
        {tiles.map((tile) => (
          <Link key={tile.href} href={tile.href} style={{ ...card, textDecoration: "none", color: "inherit", minWidth: 180, flex: 1 }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>{tile.value}</div>
            <div style={muted}>{tile.label}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
