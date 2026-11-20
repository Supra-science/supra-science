import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { PasswordChange } from "@/components/password-change";
import { MfaEnrollment } from "@/components/mfa-enrollment";
import DashboardNav from "@/components/dashboard-nav";
import { resolveEffectiveRole, roleHasPermission } from "@/lib/permissions";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const lang = await getLang();

  const [{ data: profile }, { data: role }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle(),
  ]);

  // Link visibility is a permission decision, not a role comparison:
  // the allowlisted owner is an admin even with no role row. Admins see
  // only the admin link (as before) even though they also hold
  // staff:access — the staff workspace stays reachable at /staff.
  const effectiveRole = resolveEffectiveRole(user.email, role?.role);

  async function signOut() {
    "use server";
    const client = await createClient();
    await client.auth.signOut();
    redirect("/login");
  }

  return (
    <main className="shell">
      <DashboardNav
        lang={lang}
        next="/dashboard"
        right={
          <form action={signOut}>
            <button className="btn secondary">{t("signOut", lang)}</button>
          </form>
        }
      />
      <section className="dashboard">
        <div className="eyebrow">{t("workspace", lang)}</div>
        <h1 style={{ fontSize: 46 }}>
          {t("welcome", lang)} <span className="gold">{profile?.full_name || "Supra-Science client"}</span>
        </h1>
        <p className="lead">{t("workspaceLead", lang)}</p>
        <div className="tiles">
          <Link href="/dashboard/projects" className="tile" style={{ textDecoration: "none", color: "inherit" }}>
            <h3>{t("myProjects", lang)}</h3>
            <p className="muted">{t("myProjectsDesc", lang)}</p>
          </Link>
          <Link href="/dashboard/quotations" className="tile" style={{ textDecoration: "none", color: "inherit" }}>
            <h3>{t("quotations", lang)}</h3>
            <p className="muted">{t("quotationsDesc", lang)}</p>
          </Link>
          <Link href="/dashboard/assistant" className="tile" style={{ textDecoration: "none", color: "inherit" }}>
            <h3>{t("aiAssistant", lang)}</h3>
            <p className="muted">{t("aiAssistantDesc", lang)}</p>
          </Link>
          <Link href="/dashboard/architecture" className="tile" style={{ textDecoration: "none", color: "inherit" }}>
            <h3>{t("architectureStudio", lang)}</h3>
            <p className="muted">{t("architectureStudioDesc", lang)}</p>
          </Link>
          <article className="tile">
            <h3>{t("support", lang)}</h3>
            <p className="muted">{t("supportDesc", lang)}</p>
            <a className="gold" href="https://wa.me/19178183426">
              {t("openWhatsApp", lang)} ↗
            </a>
            <br />
            <a className="gold" href="mailto:Supra-science@proton.me">
              Supra-science@proton.me
            </a>
          </article>
        </div>
        {roleHasPermission(effectiveRole, "admin:access") && (
          <p style={{ marginTop: 28 }}>
            <Link className="btn" href="/admin">
              {t("openAdmin", lang)}
            </Link>
          </p>
        )}
        {roleHasPermission(effectiveRole, "staff:access") &&
          !roleHasPermission(effectiveRole, "admin:access") && (
            <p style={{ marginTop: 28 }}>
              <Link className="btn" href="/staff">
                {t("openStaff", lang)}
              </Link>
            </p>
          )}
        <PasswordChange lang={lang} />
        <MfaEnrollment lang={lang} />
        <p className="muted" style={{ marginTop: 24 }}>
          {t("signedInAs", lang)} {user.email}
        </p>
      </section>
    </main>
  );
}
