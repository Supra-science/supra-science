// src/app/staff/quotations/page.tsx — NEW 2026-11-20 (staff permissions build).
// Staff quotations: READ-ONLY. Staff may view quotations to follow the
// pipeline, but changing a quotation commits money — status changes stay
// admin-only, so there is deliberately no StatusChanger and no
// /api/staff/quotations route.

import Link from "next/link";
import { requireStaffPage } from "@/lib/staff-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted, formatMoney } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function StaffQuotations({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  // Phase 2 (2026-11-20): reads use the caller\'s own session — RLS (migration 010) enforces the boundaries.
  const { supabase } = await requireStaffPage("quotations:read");
  const lang = await getLang();
  const { id } = await searchParams;

  if (id) {
    const { data: q } = await supabase
      .from("quotations")
      .select("*, customers(full_name, email), projects(title)")
      .eq("id", id)
      .maybeSingle();
    if (!q) {
      return (
        <main style={page}>
          <Link href="/staff/quotations" style={gold}>
            ← {t("backToList", lang)}
          </Link>
          <p style={{ ...card, marginTop: 16 }}>{t("noData", lang)}</p>
        </main>
      );
    }
    return (
      <main style={page}>
        <Link href="/staff/quotations" style={gold}>
          ← {t("backToList", lang)}
        </Link>
        <h1 style={heading}>{formatMoney(Number(q.amount_cents || 0), String(q.currency || "USD"))}</h1>
        <p style={muted}>
          {String(q.customers?.full_name || "")} · {String(q.projects?.title || "")} · {formatDate(String(q.created_at), lang)}
        </p>
        <div style={{ ...card, marginTop: 16 }}>
          <p>
            <StatusBadge status={String(q.status)} lang={lang} /> · {statusLabel(String(q.status), lang)}
          </p>
          {q.valid_until ? (
            <p style={muted}>
              {lang === "ar" ? "صالح حتى" : "Valid until"}: {formatDate(String(q.valid_until), lang)}
            </p>
          ) : null}
          {q.notes ? <p style={{ whiteSpace: "pre-wrap" }}>{String(q.notes)}</p> : null}
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("quotations")
    .select("id, amount_cents, currency, status, valid_until, created_at, customers(full_name), projects(title)")
    .order("created_at", { ascending: false })
    .limit(100);
  const quotations = data ?? [];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("quotations", lang)} <span style={gold}>({quotations.length})</span>
      </h1>
      <div style={{ ...card, marginTop: 24 }}>
        {!quotations.length && <p style={muted}>{t("noData", lang)}</p>}
        {quotations.map((q: Record<string, unknown>) => (
          <div key={String(q.id)} style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div>
              <Link href={`/staff/quotations?id=${String(q.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                {formatMoney(Number(q.amount_cents || 0), String(q.currency || "USD"))}
              </Link>
              <br />
              <span style={{ ...muted, fontSize: 14 }}>
                {String((q.customers as Record<string, unknown>)?.full_name || "")} · {String((q.projects as Record<string, unknown>)?.title || "")}
              </span>
            </div>
            <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <StatusBadge status={String(q.status)} lang={lang} />
              <span style={muted}>{formatDate(String(q.created_at), lang)}</span>
            </span>
          </div>
        ))}
      </div>
    </main>
  );
}
