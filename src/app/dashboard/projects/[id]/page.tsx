import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import DashboardNav from "@/components/dashboard-nav";

function money(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!customer) redirect("/dashboard/projects");

  // Ownership is enforced twice: the explicit customer_id match below and
  // the RLS policy ("Users can view own projects").
  const { data: project } = await supabase
    .from("projects")
    .select("id, title, description, service_domain, status, budget_range, timeline, created_at, updated_at")
    .eq("id", id)
    .eq("customer_id", customer.id)
    .maybeSingle();
  if (!project) notFound();

  const { data: quotations } = await supabase
    .from("quotations")
    .select("id, amount_cents, currency, status, valid_until, notes, stripe_payment_link, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  return (
    <main className="shell">
      <DashboardNav
        lang={lang}
        next={`/dashboard/projects/${id}`}
        right={
          <Link className="btn secondary" href="/dashboard/projects">
            {t("allProjects", lang)}
          </Link>
        }
      />
      <section className="dashboard">
        <div className="eyebrow">{t("workspace", lang)}</div>
        <h1 style={{ fontSize: 40 }}>
          {project.title} <span className="gold" style={{ fontSize: 16 }}>{statusLabel(project.status, lang)}</span>
        </h1>

        <div className="tile" style={{ maxWidth: 720, marginBottom: 16 }}>
          {project.description && <p style={{ fontSize: 14 }}>{project.description}</p>}
          <p className="muted" style={{ fontSize: 13 }}>
            {t("colDomain", lang)}: {project.service_domain}
            {project.budget_range ? ` · ${t("colBudget", lang)}: ${project.budget_range}` : ""}
            {project.timeline ? ` · ${t("colTimeline", lang)}: ${project.timeline}` : ""}
          </p>
          <p className="muted" style={{ fontSize: 12 }}>
            {t("colCreated", lang)} {formatDate(project.created_at, lang)} · {t("updated", lang)}{" "}
            {formatDate(project.updated_at, lang)}
          </p>
        </div>

        <h2 style={{ fontSize: 24 }}>
          <span className="gold">{t("quotations", lang)}</span>
        </h2>
        {(!quotations || quotations.length === 0) && (
          <p className="muted">{t("noQuotationsProject", lang)}</p>
        )}
        {(quotations ?? []).map((q) => (
          <div key={q.id} className="tile" style={{ maxWidth: 720, marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h3 style={{ margin: 0 }}>{money(q.amount_cents, q.currency)}</h3>
              <span className="gold" style={{ fontSize: 12 }}>{statusLabel(q.status, lang)}</span>
            </div>
            {q.notes && <p style={{ fontSize: 14 }}>{q.notes}</p>}
            <p className="muted" style={{ fontSize: 12 }}>
              {t("issued", lang)} {formatDate(q.created_at, lang)}
              {q.valid_until ? ` · ${t("validUntil", lang)} ${formatDate(q.valid_until, lang)}` : ""}
            </p>
            {q.status === "draft" && (
              <p className="muted" style={{ fontSize: 12 }}>
                {t("draftNote", lang)}
              </p>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}
