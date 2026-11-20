// src/app/admin/quotations/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_quotations_page_tsx_1vnt-e6c_1p04._.js`.
// Nov-5 version was a redirect-auth page; the live version uses
// requireAdminPage + getServiceSupabase + i18n and adds a detail view
// (?id=...): amount as the heading, customer/project links, valid-until,
// notes, a status changer (draft / sent / approved / rejected / expired)
// and the payments recorded against the quotation. List view shows amount,
// customer, project and valid-until.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted, formatMoney } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "sent", "approved", "rejected", "expired"];

export default async function AdminQuotations({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdminPage("quotations:read");
  const lang = await getLang();
  const supabase = getServiceSupabase();
  const { id } = await searchParams;

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("quotations", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  if (id) {
    const [{ data: quotation }, { data: payments }] = await Promise.all([
      supabase.from("quotations").select("*, customers(full_name, email), projects(title)").eq("id", id).maybeSingle(),
      supabase
        .from("payments")
        .select("id, amount_cents, currency, status, method, reference, created_at")
        .eq("quotation_id", id)
        .order("created_at", { ascending: false }),
    ]);
    if (!quotation) {
      return (
        <main style={page}>
          <Link href="/admin/quotations" style={gold}>
            ← {t("backToList", lang)}
          </Link>
          <p style={{ ...card, marginTop: 16 }}>{t("noData", lang)}</p>
        </main>
      );
    }
    const customer = quotation.customers ?? {};
    const project = quotation.projects ?? {};
    return (
      <main style={page}>
        <Link href="/admin/quotations" style={gold}>
          ← {t("backToList", lang)}
        </Link>
        <h1 style={heading}>{formatMoney(Number(quotation.amount_cents || 0), String(quotation.currency || "USD"))}</h1>
        <p style={muted}>
          {customer.full_name ? (
            <Link href={`/admin/customers?id=${String(quotation.customer_id)}`} style={gold}>
              {String(customer.full_name)}
            </Link>
          ) : (
            ""
          )}
          {project.title ? (
            <>
              {" · "}
              <Link href={`/admin/projects?id=${String(quotation.project_id)}`} style={gold}>
                {String(project.title)}
              </Link>
            </>
          ) : null}
          {" · "}
          {formatDate(String(quotation.created_at), lang)}
        </p>
        <div style={{ ...card, marginTop: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <StatusBadge status={String(quotation.status)} lang={lang} />
            <StatusChanger
              endpoint="/api/admin/quotations"
              id={String(quotation.id)}
              current={String(quotation.status)}
              options={STATUSES}
              labels={labels}
              applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
            />
          </div>
          {quotation.valid_until ? (
            <p style={{ marginTop: 12 }}>
              <strong>{t("colValidUntil", lang)}:</strong> {formatDate(String(quotation.valid_until), lang)}
            </p>
          ) : null}
          {quotation.notes ? <p style={{ whiteSpace: "pre-wrap" }}>{String(quotation.notes)}</p> : null}
        </div>
        <h2 style={{ marginTop: 28 }}>{t("payments", lang)}</h2>
        <div style={card}>
          {!(payments ?? []).length && <p style={muted}>{t("noData", lang)}</p>}
          {payments?.map((p: Record<string, unknown>) => (
            <div key={String(p.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <span>{formatMoney(Number(p.amount_cents || 0), String(p.currency || "USD"))}</span>
              <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={muted}>{String(p.method || "")}</span>
                <StatusBadge status={String(p.status)} lang={lang} />
                <span style={muted}>{formatDate(String(p.created_at), lang)}</span>
              </span>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("quotations")
    .select("id, amount_cents, currency, status, valid_until, created_at, customers(full_name), projects(title)")
    .order("created_at", { ascending: false })
    .limit(100);
  const quotations = (data ?? []) as {
    id: string;
    amount_cents: number | null;
    currency: string | null;
    status: string;
    valid_until: string | null;
    created_at: string;
    customers?: { full_name?: string | null } | null;
    projects?: { title?: string | null } | null;
  }[];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("quotations", lang)} <span style={gold}>({quotations.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!quotations.length && <p style={muted}>{t("noData", lang)}</p>}
        {quotations.map((q) => {
          const customer = q.customers ?? {};
          const project = q.projects ?? {};
          return (
            <div
              key={String(q.id)}
              style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}
            >
              <div>
                <Link href={`/admin/quotations?id=${String(q.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                  {formatMoney(Number(q.amount_cents || 0), String(q.currency || "USD"))}
                </Link>
                <br />
                <span style={{ ...muted, fontSize: 14 }}>
                  {String(customer.full_name || "")}
                  {project.title ? ` · ${String(project.title)}` : ""}
                  {q.valid_until ? ` · ${formatDate(String(q.valid_until), lang)}` : ""}
                </span>
              </div>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <StatusBadge status={String(q.status)} lang={lang} />
                <span style={muted}>{formatDate(String(q.created_at), lang)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
