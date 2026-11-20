// src/app/staff/layout.tsx — NEW 2026-11-20 (staff permissions build).
// Staff chrome: brand bar with a language toggle, a "Back to site" link
// and a sign-out server action, plus a nav row with the 7 staff sections.
// Mirrors src/app/admin/layout.tsx, deliberately narrower: no users,
// invoices, payments, services, integrations, WhatsApp or audit logs —
// those stay admin-only. Pages stay noindex/nofollow.

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireStaffPage } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";

/** Staff pages are private — never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/staff", key: "overview" },
  { href: "/staff/projects", key: "projects" },
  { href: "/staff/quotations", key: "quotations" },
  { href: "/staff/consultations", key: "consultations" },
  { href: "/staff/bookings", key: "bookings" },
  { href: "/staff/messages", key: "messages" },
  { href: "/staff/customers", key: "customers" },
];

async function signOut() {
  "use server";
  await (await createClient()).auth.signOut();
  redirect("/login");
}

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  // Guard the whole staff section here: non-staff/non-admin visitors are
  // redirected before any nav renders.
  await requireStaffPage("staff:access");
  const lang = await getLang();
  const otherLang = lang === "ar" ? "en" : "ar";
  return (
    <div dir={lang === "ar" ? "rtl" : "ltr"} lang={lang} style={{ background: "#F8FAFC", color: "#0B132B", minHeight: "100vh" }}>
      <nav style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", padding: "14px 32px", borderBottom: "1px solid #06B6D4" }}>
        <Link href="/staff" style={{ color: "#0B132B", textDecoration: "none", fontWeight: 700 }}>
          <span style={{ background: "#ffffff", color: "#6366F1", border: "1px solid #06B6D4", borderRadius: 4, padding: "2px 8px", marginInlineEnd: 8 }}>S</span>
          SUPRA<span style={{ color: "#6366F1" }}>/</span>SCIENCE
          <span style={{ marginInlineStart: 12, fontSize: 11, fontWeight: 700, letterSpacing: ".08em", color: "#047857", background: "#D1FAE5", borderRadius: 999, padding: "3px 9px" }}>STAFF</span>
        </Link>
        <span style={{ flex: 1 }} />
        <a href={`/api/lang?to=${otherLang}&next=/staff`} style={{ color: "#6366F1", fontSize: 13 }}>
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
