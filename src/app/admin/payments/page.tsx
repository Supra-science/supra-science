// src/app/admin/payments/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_payments_page_tsx_0sdv82-5pl6yf._.js`.
// Nov-5 version was a redirect-auth page selecting "*"; the live version
// uses requireAdminPage + getServiceSupabase + i18n, selects explicit
// columns with customers/invoices joins, and shows a "Collected" total
// (sum of succeeded payments) at the top. Received date falls back to
// created_at. No status changer: payment status is only ever set by the
// POST /api/admin/payments route.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate } from "@/lib/i18n";
import { page, heading, card, row, gold, muted, formatMoney } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

type Payment = {
  id: string;
  amount_cents: number | null;
  currency: string | null;
  status: string;
  method: string | null;
  reference: string | null;
  notes: string | null;
  received_at: string | null;
  created_at: string;
  customers?: { full_name?: string | null; email?: string | null } | null;
  invoices?: { number?: string | null } | null;
};

export default async function AdminPayments() {
  await requireAdminPage("payments:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("payments", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const { data } = await supabase
    .from("payments")
    .select("id, amount_cents, currency, status, method, reference, notes, received_at, created_at, customers(full_name, email), invoices(number)")
    .order("created_at", { ascending: false })
    .limit(100);
  const items = (data ?? []) as Payment[];
  const collectedCents = items
    .filter((p) => String(p.status) === "succeeded")
    .reduce((sum, p) => sum + Number(p.amount_cents || 0), 0);

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("payments", lang)} <span style={gold}>({items.length})</span>
      </h1>
      <p style={muted}>
        {t("collected", lang)}:{" "}
        <span style={gold}>${(collectedCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span>
      </p>
      <div style={{ ...card, marginTop: 24 }}>
        {!items.length && <p style={muted}>{t("noData", lang)}</p>}
        {items.map((item) => {
          const customer = item.customers ?? {};
          const invoice = item.invoices ?? {};
          return (
            <div key={String(item.id)} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <strong>{formatMoney(Number(item.amount_cents || 0), String(item.currency || "USD"))}</strong>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={muted}>{String(item.method || "")}</span>
                  <StatusBadge status={String(item.status)} lang={lang} />
                  <span style={muted}>{formatDate(String(item.received_at || item.created_at), lang)}</span>
                </span>
              </div>
              <p style={{ ...muted, fontSize: 13, margin: "6px 0 0" }}>
                {String(customer.full_name || "")}
                {customer.email ? ` · ${String(customer.email)}` : ""}
                {invoice.number ? (
                  <>
                    {" · "}
                    <Link href="/admin/invoices" style={gold}>
                      {String(invoice.number)}
                    </Link>
                  </>
                ) : null}
                {item.reference ? ` · ${String(item.reference)}` : ""}
              </p>
              {item.notes ? (
                <p style={{ fontSize: 13, margin: "4px 0 0", whiteSpace: "pre-wrap" }}>{String(item.notes)}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
