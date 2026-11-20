// src/app/staff/projects/page.tsx — NEW 2026-11-20 (staff permissions build).
// Staff project list + detail. Mirrors the admin projects page, with two
// deliberate cuts: the detail view shows quotations and consultations
// only — NO invoices section (financial data stays admin-only) — and
// the status changer posts to /api/staff/projects (staff guard, audited).

import Link from "next/link";
import { requireStaffPage, getServiceSupabase } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted, formatMoney } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["new_inquiry", "consultation", "requirements", "quotation", "awaiting_payment", "in_progress", "review", "completed", "cancelled"];

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  service_domain: string;
  budget_range: string | null;
  timeline: string | null;
  created_at: string;
  customers?: { full_name?: string | null } | null;
};

export default async function StaffProjects({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireStaffPage("projects:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();
  const { id } = await searchParams;

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("projects", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  if (id) {
    const [{ data: project }, { data: quotations }, { data: consultations }] = await Promise.all([
      supabase.from("projects").select("*, customers(full_name, email)").eq("id", id).maybeSingle(),
      supabase
        .from("quotations")
        .select("id, amount_cents, currency, status, valid_until, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("consultations")
        .select("id, message, status, created_at")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (!project) {
      return (
        <main style={page}>
          <Link href="/staff/projects" style={gold}>
            ← {t("backToList", lang)}
          </Link>
          <p style={{ ...card, marginTop: 16 }}>{t("noData", lang)}</p>
        </main>
      );
    }
    const customer = project.customers ?? {};
    return (
      <main style={page}>
        <Link href="/staff/projects" style={gold}>
          ← {t("backToList", lang)}
        </Link>
        <h1 style={heading}>{String(project.title)}</h1>
        <p style={muted}>
          {customer.full_name ? (
            <Link href={`/staff/customers?id=${String(project.customer_id)}`} style={gold}>
              {String(customer.full_name)}
            </Link>
          ) : (
            ""
          )}
          {customer.email ? ` · ${String(customer.email)}` : ""} · {formatDate(String(project.created_at), lang)}
        </p>
        <div style={{ ...card, marginTop: 16 }}>
          <p>
            <strong>{t("colDomain", lang)}:</strong> {String(project.service_domain)}
          </p>
          {project.budget_range ? (
            <p>
              <strong>{t("colBudget", lang)}:</strong> {String(project.budget_range)}
            </p>
          ) : null}
          {project.timeline ? (
            <p>
              <strong>{t("colTimeline", lang)}:</strong> {String(project.timeline)}
            </p>
          ) : null}
          {project.description ? <p style={{ whiteSpace: "pre-wrap" }}>{String(project.description)}</p> : null}
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
            <StatusBadge status={String(project.status)} lang={lang} />
            <StatusChanger
              endpoint="/api/staff/projects"
              id={String(project.id)}
              current={String(project.status)}
              options={STATUSES}
              labels={labels}
              applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
            />
          </div>
        </div>

        <h2 style={{ marginTop: 28 }}>{t("projectQuotations", lang)}</h2>
        <div style={card}>
          {!(quotations ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {quotations?.map((q: Record<string, unknown>) => (
            <div key={String(q.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>{formatMoney(Number(q.amount_cents || 0), String(q.currency || "USD"))}</span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={String(q.status)} lang={lang} />
                <span style={muted}>{formatDate(String(q.created_at), lang)}</span>
              </span>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 28 }}>{t("consultations", lang)}</h2>
        <div style={card}>
          {!(consultations ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {consultations?.map((c: Record<string, unknown>) => (
            <div key={String(c.id)} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <StatusBadge status={String(c.status)} lang={lang} />
                <span style={muted}>{formatDate(String(c.created_at), lang)}</span>
              </div>
              <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{String(c.message).slice(0, 400)}</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("projects")
    .select("id, title, status, service_domain, budget_range, timeline, created_at, customers(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const projects = (data ?? []) as ProjectRow[];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("projects", lang)} <span style={gold}>({projects.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!projects.length && <p style={muted}>{t("noData", lang)}</p>}
        {projects.map((project) => {
          const customer = project.customers ?? {};
          return (
            <div
              key={String(project.id)}
              style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}
            >
              <div>
                <Link href={`/staff/projects?id=${String(project.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                  {String(project.title)}
                </Link>
                <br />
                <span style={{ ...muted, fontSize: 14 }}>
                  {String(customer.full_name || "")} · {String(project.service_domain)}
                  {project.budget_range ? ` · ${String(project.budget_range)}` : ""}
                </span>
              </div>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <StatusBadge status={String(project.status)} lang={lang} />
                <span style={muted}>{formatDate(String(project.created_at), lang)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
