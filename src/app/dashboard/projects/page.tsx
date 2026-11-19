import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import DashboardNav from "@/components/dashboard-nav";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();

  const { data: customer } = await supabase
    .from("customers")
    .select("id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  // RLS ("Users can view own projects") already scopes this to the caller's
  // customer record; the explicit filter below is defense in depth.
  const { data: projects } = customer
    ? await supabase
        .from("projects")
        .select("id, title, status, service_domain, created_at")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false })
    : { data: [] as Array<{ id: string; title: string; status: string; service_domain: string; created_at: string }> | null };

  const list = projects ?? [];

  return (
    <main className="shell">
      <DashboardNav
        lang={lang}
        next="/dashboard/projects"
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
            <span className="gold">{t("myProjects", lang)}</span>
          ) : (
            <>
              My <span className="gold">Projects</span>
            </>
          )}
        </h1>

        {!customer && (
          <div className="tile" style={{ maxWidth: 640 }}>
            <h3 style={{ marginTop: 0 }}>{t("noCustomerProfile", lang)}</h3>
            <p className="muted">{t("noCustomerProfileBody", lang)}</p>
            <p>
              <a className="gold" href="https://wa.me/19178183426">
                {t("openWhatsApp", lang)} ↗
              </a>
              <br />
              <a className="gold" href="mailto:Supra-science@proton.me">
                Supra-science@proton.me
              </a>
            </p>
          </div>
        )}

        {customer && list.length === 0 && (
          <div className="tile" style={{ maxWidth: 640 }}>
            <h3 style={{ marginTop: 0 }}>{t("noProjects", lang)}</h3>
            <p className="muted">{t("noProjectsBody", lang)}</p>
          </div>
        )}

        {list.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/projects/${p.id}`}
            className="tile"
            style={{ display: "block", maxWidth: 640, marginBottom: 12, textDecoration: "none", color: "inherit" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <h3 style={{ margin: 0 }}>{p.title}</h3>
              <span className="gold" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
                {statusLabel(p.status, lang)}
              </span>
            </div>
            <p className="muted" style={{ margin: "6px 0 0", fontSize: 13 }}>
              {p.service_domain} · {formatDate(p.created_at, lang)}
            </p>
          </Link>
        ))}
      </section>
    </main>
  );
}
