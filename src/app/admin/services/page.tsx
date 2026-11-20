// src/app/admin/services/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from module 65398 in chunk
// `.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1g5svx0c8vj3n._.js`.
// Server part rewritten to the Nov-8 pattern (requireAdminPage +
// getServiceSupabase + i18n, error message shown when the load fails or the
// service key is missing). The editing UI itself is unchanged: the Nov-5
// client component ServiceList from src/components/service-editor.tsx
// (module 25756) receives the rows. Services are selected "*" ordered by
// sort_order.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { page, heading, card, gold, muted } from "@/lib/admin-styles";
import { ServiceList } from "@/components/service-editor";

export const dynamic = "force-dynamic";

export default async function AdminServices() {
  await requireAdminPage("services:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  let services: Record<string, unknown>[] = [];
  let loadError: string | null = null;
  if (supabase) {
    try {
      const { data, error } = await supabase.from("services").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      services = (data ?? []) as Record<string, unknown>[];
    } catch (e) {
      loadError = e instanceof Error ? e.message : "database error";
    }
  } else {
    loadError = "missing-service-key";
  }

  return (
    <main style={page}>
      <Link href="/admin" style={gold}>
        ← {t("backToAdmin", lang)}
      </Link>
      <h1 style={heading}>{t("services", lang)}</h1>
      <p style={{ ...muted, fontSize: 14, maxWidth: 640 }}>
        {lang === "ar"
          ? "عدّل الخدمات أو أضفها أو أخفها دون لمس الكود. التغييرات تظهر على صفحات الخدمات العامة فوراً. لا أسعار ولا ادعاءات وهمية — أبقِ كل إدخال صادقاً."
          : "Edit, add, or hide services without touching code. Changes go live on the public Services pages immediately. No prices or fake claims — keep every entry honest."}
      </p>
      {loadError && (
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>
          {t("dbNotConfigured", lang)}
          {loadError !== "missing-service-key" ? ` (${loadError.slice(0, 120)})` : ""}
        </p>
      )}
      {/* TODO(RECONSTRUCTION-GAP): ServiceList lives in the Nov-5 base
          (src/components/service-editor.tsx) and is out of scope for this
          admin-additions reconstruction; it is imported here unchanged. */}
      <ServiceList initial={services} />
    </main>
  );
}
