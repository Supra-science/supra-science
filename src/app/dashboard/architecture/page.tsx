import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import DashboardNav from "@/components/dashboard-nav";
import ArchitectureClient from "./architecture-client";

export default async function ArchitecturePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();

  // Draft history degrades gracefully when migration 005 is not applied yet.
  let drafts: Array<{
    id: string;
    title: string;
    status: string;
    created_at: string;
    draft: unknown;
  }> = [];
  let historyAvailable = true;
  try {
    const { data, error } = await supabase
      .from("architecture_drafts")
      .select("id, title, status, created_at, draft")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    drafts = (data ?? []) as typeof drafts;
  } catch {
    historyAvailable = false;
  }

  return (
    <main className="shell">
      <DashboardNav
        lang={lang}
        next="/dashboard/architecture"
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
            <span className="gold">{t("architectureStudio", lang)}</span>
          ) : (
            <>
              Architecture <span className="gold">Studio</span>
            </>
          )}
        </h1>
        <p className="lead">{t("architectureLead", lang)}</p>
        {!historyAvailable && (
          <p className="muted" style={{ fontSize: 13 }}>
            {t("historyUnavailable", lang)}
          </p>
        )}
        <ArchitectureClient
          lang={lang}
          initialDrafts={drafts.map((d) => ({
            id: d.id,
            title: d.title,
            status: d.status,
            created_at: d.created_at,
            draft: d.draft as never,
          }))}
        />
      </section>
    </main>
  );
}
