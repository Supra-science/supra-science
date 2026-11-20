// src/app/admin/invoices/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from module 72154 in chunk
// `.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1kqe3xbywdxp8._.js`.
// Server part rewritten to the Nov-8 pattern (requireAdminPage +
// getServiceSupabase + i18n). Loads invoices with customers (newest first,
// 100) and all customers for the create form, then enriches each invoice
// with paid_cents / balance_cents from succeeded payments. The editing UI
// is unchanged: the Nov-5 client component InvoiceManager from
// src/components/invoice-manager.tsx (module 14864) receives the rows.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { page, heading, card, gold, muted } from "@/lib/admin-styles";
import { InvoiceManager } from "@/components/invoice-manager";

export const dynamic = "force-dynamic";

type InvoiceWithTotals = Record<string, unknown> & { paid_cents: number; balance_cents: number };

export default async function AdminInvoices() {
  await requireAdminPage("invoices:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  let invoices: InvoiceWithTotals[] = [];
  let customers: { id: string; full_name: string; email: string }[] = [];
  let loadError: string | null = null;
  if (supabase) {
    try {
      const [{ data: invData, error: invError }, { data: custData, error: custError }] = await Promise.all([
        supabase.from("invoices").select("*, customers(full_name, email)").order("created_at", { ascending: false }).limit(100),
        supabase.from("customers").select("id, full_name, email").order("full_name", { ascending: true }).limit(200),
      ]);
      if (invError) throw invError;
      if (custError) throw custError;
      // Paid/balance are derived from recorded succeeded payments only.
      for (const inv of invData ?? []) {
        const { data: pays } = await supabase
          .from("payments")
          .select("amount_cents")
          .eq("invoice_id", inv.id)
          .eq("status", "succeeded");
        const paid = (pays ?? []).reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount_cents || 0), 0);
        const total = Number(inv.amount_cents || 0);
        invoices.push({ ...(inv as Record<string, unknown>), paid_cents: paid, balance_cents: Math.max(0, total - paid) });
      }
      customers = (custData ?? []).map((c: Record<string, unknown>) => ({
        id: String(c.id),
        full_name: String(c.full_name),
        email: String(c.email),
      }));
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
      <h1 style={heading}>{t("invoices", lang)}</h1>
      <p style={{ ...muted, fontSize: 14, maxWidth: 680 }}>
        {lang === "ar"
          ? "فوترة يدوية بلا رسوم: أنشئ الفواتير، وسجّل التحويلات البنكية أو النقد الذي استلمته فعلاً، وتتبّع الأرصدة. تصبح الفاتورة «مدفوعة» فقط من المدفوعات المسجلة — وليس باليد أبداً."
          : "Manual, zero-fee invoicing: create invoices, record bank transfers or cash you actually received, and track balances. An invoice becomes paid only from recorded payments — never by hand."}
      </p>
      {loadError && (
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>
          {t("dbNotConfigured", lang)}
          {loadError !== "missing-service-key" ? ` (${loadError.slice(0, 120)})` : ""}
        </p>
      )}
      {/* TODO(RECONSTRUCTION-GAP): InvoiceManager lives in the Nov-5 base
          (src/components/invoice-manager.tsx) and is out of scope for this
          admin-additions reconstruction; it is imported here unchanged. */}
      <InvoiceManager initial={invoices} customers={customers} />
    </main>
  );
}
