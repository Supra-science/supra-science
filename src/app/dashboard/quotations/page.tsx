import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import DashboardNav from "@/components/dashboard-nav";

function money(cents: number, currency: string): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}

export default async function QuotationsPage() {
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

  // RLS scopes quotations to the caller's own projects; the explicit
  // customer_id filter is defense in depth.
  const { data: quotations } = customer
    ? await supabase
        .from("quotations")
        .select("id, amount_cents, currency, status, valid_until, created_at, project_id, projects!inner(title)")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
    : { data: [] as Array<{
        id: string; amount_cents: number; currency: string; status: string;
        valid_until: string | null; created_at: string; project_id: string;
        projects: { title: string };
      }> | null };

  const list = (quotations ?? []) as Array<{
    id: string; amount_cents: number; currency: string; status: string;
    valid_until: string | null; created_at: string; project_id: string;
    projects: { title: string };
  }>;

  return (
    <main className="shell">
      <DashboardNav
        lang={lang}
        next="/dashboard/quotations"
        right={
          <Link className="btn secondary" href="/dashboard">
            {t("backToWorkspace", lang)}
          </Link>
        }
      />
      <section className="dashboard">
        <div className="eyebrow">{t("workspace", lang)}</div>
        <h1 style={{ fontSize: 40 }}>
          {lang === "ar" ? (
            <span className="gold">{t("quotations", lang)}</span>
          ) : (
            <>
              My <span className="gold">Quotations</span>
            </>
          )}
        </h1>

        {list.length === 0 && (
          <div className="tile" style={{ maxWidth: 640 }}>
            <h3 style={{ marginTop: 0 }}>{t("noQuotations", lang)}</h3>
            <p className="muted">{t("noQuotationsBody", lang)}</p>
          </div>
        )}

        {list.map((q) => (
          <Link
            key={q.id}
            href={`/dashboard/projects/${q.project_id}`}
            className="tile"
            style={{ display: "block", maxWidth: 640, marginBottom: 12, textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h3 style={{ margin: 0 }}>{money(q.amount_cents, q.currency)}</h3>
              <span className="gold" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                {statusLabel(q.status, lang)}
              </span>
            </div>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
              {q.projects.title} · {t("issued", lang)} {formatDate(q.created_at, lang)}
              {q.valid_until ? ` · ${t("validUntil", lang)} ${formatDate(q.valid_until, lang)}` : ""}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
