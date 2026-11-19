// src/app/admin/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_page_tsx_2179ca_6szw48._.js`.
// Nov-5 dashboard (if any) is replaced by a live overview: seven stat
// cards (customers, projects, pending consultations, quotations awaiting
// decision, unread messages, open WhatsApp conversations, collected
// succeeded payments), the five most recent projects, a database-error
// banner when the service client is missing or a query fails, and an
// integration-status strip that reports only whether WHATSAPP_ACCESS_TOKEN
// and OPENAI_API_KEY are set — never their values.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, card, row, gold, muted } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const { user } = await requireAdminPage();
  const lang = await getLang();
  const supabase = getServiceSupabase();

  const stats = {
    customers: null as number | null,
    projects: null as number | null,
    pendingConsultations: null as number | null,
    quotationsAwaiting: null as number | null,
    unreadMessages: null as number | null,
    openConversations: null as number | null,
    collectedCents: null as number | null,
  };
  let recentProjects: { id: string; title: string; status: string; created_at: string }[] = [];
  let loadError: string | null = null;

  if (supabase) {
    try {
      const [
        { count: customers },
        { count: projects },
        { count: pendingConsultations },
        { count: quotationsAwaiting },
        { count: unreadMessages },
        { count: openConversations },
        { data: payments },
        { data: recent },
      ] = await Promise.all([
        supabase.from("customers").select("*", { count: "exact", head: true }),
        supabase.from("projects").select("*", { count: "exact", head: true }),
        supabase.from("consultations").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("quotations").select("*", { count: "exact", head: true }).eq("status", "sent"),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("whatsapp_conversations").select("*", { count: "exact", head: true }).eq("status", "open"),
        supabase.from("payments").select("amount_cents").eq("status", "succeeded"),
        supabase.from("projects").select("id, title, status, created_at").order("created_at", { ascending: false }).limit(5),
      ]);
      stats.customers = customers;
      stats.projects = projects;
      stats.pendingConsultations = pendingConsultations;
      stats.quotationsAwaiting = quotationsAwaiting;
      stats.unreadMessages = unreadMessages;
      stats.openConversations = openConversations;
      stats.collectedCents = (payments ?? []).reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount_cents || 0), 0);
      recentProjects = (recent ?? []) as typeof recentProjects;
    } catch (e) {
      loadError = e instanceof Error ? e.message : "database error";
    }
  } else {
    loadError = "missing-service-key";
  }

  const cards = [
    { label: t("totalCustomers", lang), value: stats.customers === null ? "—" : String(stats.customers), href: "/admin/customers" },
    { label: t("totalProjects", lang), value: stats.projects === null ? "—" : String(stats.projects), href: "/admin/projects" },
    { label: t("pendingConsultations", lang), value: stats.pendingConsultations === null ? "—" : String(stats.pendingConsultations), href: "/admin/consultations" },
    { label: t("quotationsAwaiting", lang), value: stats.quotationsAwaiting === null ? "—" : String(stats.quotationsAwaiting), href: "/admin/quotations" },
    { label: t("unreadMessages", lang), value: stats.unreadMessages === null ? "—" : String(stats.unreadMessages), href: "/admin/messages" },
    { label: t("openConversations", lang), value: stats.openConversations === null ? "—" : String(stats.openConversations), href: "/admin/whatsapp" },
    {
      label: t("collected", lang),
      value: stats.collectedCents === null ? "—" : `$${(stats.collectedCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      href: "/admin/payments",
    },
  ];

  return (
    <main style={page}>
      <div className="eyebrow" style={gold}>
        {t("restricted", lang)}
      </div>
      <h1 style={{ fontSize: 42 }}>
        {lang === "ar" ? "مركز " : "Control "}
        <span style={gold}>{lang === "ar" ? "التحكم." : "center."}</span>
      </h1>
      <p style={muted}>{user.email}</p>
      {loadError && (
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>
          {t("dbNotConfigured", lang)}
          {loadError !== "missing-service-key" ? ` (${loadError.slice(0, 120)})` : ""}
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginTop: 24 }}>
        {cards.map((c) => (
          <Link key={c.href} href={c.href} style={{ textDecoration: "none", color: "inherit" }}>
            <article style={{ ...card, border: "1px solid #E2E8F0" }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>{c.label}</h3>
              <strong style={{ ...gold, fontSize: 32 }}>{c.value}</strong>
            </article>
          </Link>
        ))}
      </div>
      <div style={{ marginTop: 32 }}>
        <h2>{t("recentProjects", lang)}</h2>
        <div style={card}>
          {!recentProjects.length && <p style={muted}>{t("noData", lang)}</p>}
          {recentProjects.map((p) => (
            <div key={String(p.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Link href={`/admin/projects?id=${String(p.id)}`} style={{ color: "#6366F1" }}>
                {String(p.title)}
              </Link>
              <span style={gold}>
                {statusLabel(String(p.status), lang)} · {formatDate(String(p.created_at), lang)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 32, padding: 16, ...card, borderInlineStart: "4px solid #6366F1" }}>
        <h3>{t("integrationStatus", lang)}</h3>
        <p style={{ ...muted, fontSize: 14 }}>
          WhatsApp Cloud API: {process.env.WHATSAPP_ACCESS_TOKEN ? "configured" : "pending credentials"}
          {" · OpenAI: "}
          {process.env.OPENAI_API_KEY ? "configured" : "pending API key"}
          {" · Supabase: "}
          configured
        </p>
      </div>
    </main>
  );
}
