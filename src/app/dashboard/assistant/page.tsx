import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import DashboardNav from "@/components/dashboard-nav";
import ChatClient from "./chat-client";

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();

  return (
    <main className="shell">
      <DashboardNav
        lang={lang}
        next="/dashboard/assistant"
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
            <span className="gold">{t("aiAssistant", lang)}</span>
          ) : (
            <>
              AI <span className="gold">Assistant</span>
            </>
          )}
        </h1>
        <p className="lead">{t("assistantLead", lang)}</p>
        <ChatClient lang={lang} />
      </section>
    </main>
  );
}
