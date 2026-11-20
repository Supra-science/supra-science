// src/app/staff/customers/page.tsx — NEW 2026-11-20 (staff permissions build).
// Staff customers: READ-ONLY. Staff may view customer records and their
// projects/quotations to follow the work, but may NOT edit customer data
// and may NOT see invoices — no invoice section, no edit controls.

import Link from "next/link";
import { requireStaffPage } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted, formatMoney } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function StaffCustomers({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  // Phase 2 (2026-11-20): reads use the caller\'s own session — RLS (migration 010) enforces the boundaries.
  const { supabase } = await requireStaffPage("customers:read");
  const lang = await getLang();
  const { id } = await searchParams;

  if (id) {
    const [{ data: customer }, { data: projects }, { data: quotations }] = await Promise.all([
      supabase.from("customers").select("*").eq("id", id).maybeSingle(),
      supabase.from("projects").select("id, title, status, created_at").eq("customer_id", id).order("created_at", { ascending: false }),
      supabase
        .from("quotations")
        .select("id, amount_cents, currency, status, valid_until, created_at")
        .eq("customer_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (!customer) {
      return (
        <main style={page}>
          <Link href="/staff/customers" style={gold}>
            ← {t("backToList", lang)}
          </Link>
          <p style={{ ...card, marginTop: 16 }}>{t("noData", lang)}</p>
        </main>
      );
    }
    return (
      <main style={page}>
        <Link href="/staff/customers" style={gold}>
          ← {t("backToList", lang)}
        </Link>
        <h1 style={heading}>{String(customer.full_name || customer.email)}</h1>
        <p style={muted}>
          {String(customer.email || "")}
          {customer.phone ? ` · ${String(customer.phone)}` : ""}
          {customer.company ? ` · ${String(customer.company)}` : ""}
          {customer.country ? ` · ${String(customer.country)}` : ""} · {formatDate(String(customer.created_at), lang)}
        </p>

        <h2 style={{ marginTop: 28 }}>{t("projects", lang)}</h2>
        <div style={card}>
          {!(projects ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {projects?.map((p: Record<string, unknown>) => (
            <div key={String(p.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <Link href={`/staff/projects?id=${String(p.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                {String(p.title)}
              </Link>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={String(p.status)} lang={lang} />
                <span style={muted}>{formatDate(String(p.created_at), lang)}</span>
              </span>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 28 }}>{t("quotations", lang)}</h2>
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
      </main>
    );
  }

  const { data } = await supabase
    .from("customers")
    .select("id, full_name, email, phone, company, country, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const customers = data ?? [];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("customers", lang)} <span style={gold}>({customers.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!customers.length && <p style={muted}>{t("noData", lang)}</p>}
        {customers.map((c: Record<string, unknown>) => (
          <div key={String(c.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <Link href={`/staff/customers?id=${String(c.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                {String(c.full_name || c.email)}
              </Link>
              <br />
              <span style={{ ...muted, fontSize: 14 }}>
                {String(c.email || "")}
                {c.company ? ` · ${String(c.company)}` : ""}
                {c.country ? ` · ${String(c.country)}` : ""}
              </span>
            </div>
            <span style={muted}>{formatDate(String(c.created_at), lang)}</span>
          </div>
        ))}
      </div>
    </main>
  );
}
