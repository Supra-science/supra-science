// src/app/admin/layout.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_layout_tsx_19cm4-uiv_jvz._.js`.
// Nov-5 version was a pass-through that only set robots metadata; the live
// version adds the admin chrome: brand bar with a language toggle
// (/api/lang?to=…&next=/admin), a "Back to site" link and a sign-out server
// action (supabase signOut, then redirect /login), plus a nav row with all
// 16 admin sections. Pages stay noindex/nofollow.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdminPage } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

/** Admin pages are private — never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", key: "overview" },
  { href: "/admin/customers", key: "customers" },
  { href: "/admin/projects", key: "projects" },
  { href: "/admin/quotations", key: "quotations" },
  { href: "/admin/consultations", key: "consultations" },
  { href: "/admin/bookings", key: "bookings" },
  { href: "/admin/invoices", key: "invoices" },
  { href: "/admin/payments", key: "payments" },
  { href: "/admin/messages", key: "messages" },
  { href: "/admin/whatsapp", key: "whatsapp" },
  { href: "/admin/drafts", key: "drafts" },
  { href: "/admin/users", key: "users" },
  { href: "/admin/notifications", key: "notifications" },
  { href: "/admin/integrations", key: "integrations" },
  { href: "/admin/audit-logs", key: "auditLogs" },
  { href: "/admin/services", key: "services" },
];

async function signOut() {
  "use server";
  await (await createClient()).auth.signOut();
  redirect("/login");
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Guard the whole admin section here (added 2026-11-13, audit finding #7):
  // previously this layout rendered the 16-section nav to any visitor and
  // each page guarded itself. Non-admins are redirected before any nav renders.
  await requireAdminPage();
  const lang = await getLang();
  const otherLang = lang === "ar" ? "en" : "ar";
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ background: "#F8FAFC", color: "#0B132B", minHeight: "100vh" }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "14px 32px", borderBottom: "1px solid #06B6D4" }}>
        <Link href="/admin" style={{ color: "#0B132B", textDecoration: "none", fontWeight: 700 }}>
          <span style={{ background: "#ffffff", color: "#6366F1", border: "1px solid #06B6D4", borderRadius: 4, padding: "2px 8px", marginInlineEnd: 8 }}>S</span>
          SUPRA<span style={{ color: "#6366F1" }}>/</span>SCIENCE
          <span style={{ marginInlineStart: 12, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "#4F46E5", background: "#EEF2FF", borderRadius: 999, padding: "3px 9px" }}>ADMIN</span>
        </Link>
        <span style={{ flex: 1 }} />
        <a href={`/api/lang?to=${otherLang}&next=/admin`} style={{ color: "#6366F1", fontSize: 13 }}>
          {otherLang === "ar" ? "العربية" : "English"}
        </a>
        <Link href="/ar" style={{ color: "#5a6470", fontSize: 13 }}>
          {t("backToSite", lang)}
        </Link>
        <form action={signOut}>
          <button
            style={{ border: "1px solid #94a3b8", background: "transparent", color: "#0B132B", padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
          >
            {t("signOut", lang)}
          </button>
        </form>
      </nav>
      <nav style={{ display: "flex", gap: 4, flexWrap: "wrap", padding: "10px 32px", borderBottom: "1px solid #e5e7eb" }}>
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            style={{ color: "#39404d", fontSize: 13, padding: "6px 10px", borderRadius: 6, textDecoration: "none" }}
          >
            {t(item.key, lang)}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
