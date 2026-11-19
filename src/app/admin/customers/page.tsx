// src/app/admin/customers/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_customers_page_tsx_1lm4x4xiglmpy._.js`.
// Nov-5 version was a redirect-auth list page; the live version uses
// requireAdminPage + getServiceSupabase + i18n and adds a detail view
// (?id=...): customer header (email, phone, company, country) plus four
// sections — projects, quotations, invoices, consultations — each linking
// back to its own admin page. List view shows name, email, phone, company,
// country and join date.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate } from "@/lib/i18n";
import { page, heading, card, row, gold, muted, formatMoney } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

type Customer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  company: string | null;
  country: string | null;
  created_at: string;
};

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdminPage();
  const lang = await getLang();
  const supabase = getServiceSupabase();
  const { id } = await searchParams;

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("customers", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  if (id) {
    const [{ data: customer }, { data: projects }, { data: quotations }, { data: invoices }, { data: consultations }] =
      await Promise.all([
        supabase.from("customers").select("*").eq("id", id).maybeSingle(),
        supabase.from("projects").select("id, title, status, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
        supabase
          .from("quotations")
          .select("id, amount_cents, currency, status, valid_until, created_at")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("invoices")
          .select("id, number, amount_cents, currency, status, created_at")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),
        supabase
          .from("consultations")
          .select("id, message, status, preferred_contact, created_at")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),
      ]);
    if (!customer) {
      return (
        <main style={page}>
          <Link href="/admin/customers" style={gold}>
            ← {t("backToList", lang)}
          </Link>
          <p style={{ ...card, marginTop: 16 }}>{t("noData", lang)}</p>
        </main>
      );
    }
    return (
      <main style={page}>
        <Link href="/admin/customers" style={gold}>
          ← {t("backToList", lang)}
        </Link>
        <h1 style={heading}>{String(customer.full_name)}</h1>
        <p style={muted}>
          {String(customer.email)}
          {customer.phone ? ` · ${String(customer.phone)}` : ""}
          {customer.company ? ` · ${String(customer.company)}` : ""}
          {customer.country ? ` · ${String(customer.country)}` : ""}
        </p>

        <h2 style={{ marginTop: 28 }}>{t("customerProjects", lang)}</h2>
        <div style={card}>
          {!(projects ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {projects?.map((p: Record<string, unknown>) => (
            <div key={String(p.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Link href={`/admin/projects?id=${String(p.id)}`} style={{ color: "#6366F1" }}>
                {String(p.title)}
              </Link>
              <StatusBadge status={String(p.status)} lang={lang} />
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 28 }}>{t("customerQuotations", lang)}</h2>
        <div style={card}>
          {!(quotations ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {quotations?.map((q: Record<string, unknown>) => (
            <div key={String(q.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>{formatMoney(Number(q.amount_cents || 0), String(q.currency || "USD"))}</span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={String(q.status)} lang={lang} />
                <span style={muted}>{formatDate(String(q.created_at), lang)}</span>
              </span>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 28 }}>{t("customerInvoices", lang)}</h2>
        <div style={card}>
          {!(invoices ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {invoices?.map((inv: Record<string, unknown>) => (
            <div key={String(inv.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Link href="/admin/invoices" style={{ color: "#6366F1" }}>
                {String(inv.number)}
              </Link>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span>{formatMoney(Number(inv.amount_cents || 0), String(inv.currency || "USD"))}</span>
                <StatusBadge status={String(inv.status)} lang={lang} />
              </span>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 28 }}>{t("customerConsultations", lang)}</h2>
        <div style={card}>
          {!(consultations ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {consultations?.map((c: Record<string, unknown>) => (
            <div key={String(c.id)} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <StatusBadge status={String(c.status)} lang={lang} />
                <span style={muted}>{formatDate(String(c.created_at), lang)}</span>
              </div>
              <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{String(c.message).slice(0, 400)}</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, company, country, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const customers = (data ?? []) as Customer[];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("customers", lang)} <span style={gold}>({customers.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!customers.length && <p style={muted}>{t("noData", lang)}</p>}
        {customers.map((customer) => (
          <div
            key={String(customer.id)}
            style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}
          >
            <div>
              <Link href={`/admin/customers?id=${String(customer.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                {String(customer.full_name)}
              </Link>
              <br />
              <span style={{ ...muted, fontSize: 14 }}>{String(customer.email)}</span>
              {customer.phone ? <span style={{ ...muted, fontSize: 14 }}> · {String(customer.phone)}</span> : null}
            </div>
            <span style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14 }}>
              <span style={muted}>{String(customer.company || "")}</span>
              <span style={gold}>{String(customer.country || "—")}</span>
              <span style={muted}>{formatDate(String(customer.created_at), lang)}</span>
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
