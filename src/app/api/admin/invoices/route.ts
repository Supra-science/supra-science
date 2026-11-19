// src/app/api/admin/invoices/route.ts — PRE-EXISTING in Nov-5; UNCHANGED in
// the Nov-8 live build (verified: the live userland module 75450 in chunk
// `_0em2z7ylw0z26._.js` matches the Nov-5 source behaviour exactly,
// including the same error strings and the INV-YYYY-NNNN numbering).
// Included here so the live admin API set is complete.
// GET: list invoices with customer name, paid totals and balance.
// POST: create invoice { customer_id, quotation_id?, amount_cents, currency?, due_date?, notes? }.
// PATCH: update status/notes { id, status?, notes?, due_date? }.
// Honesty rule: an invoice is NEVER marked paid here — paid state is derived
// from recorded payments (see /api/admin/payments). Note: unlike the new
// PATCH routes, this route does NOT write an audit row.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "sent", "partially_paid", "paid", "overdue", "cancelled"];

async function invoiceWithTotals(admin: ReturnType<typeof serviceSupabase>, inv: Record<string, unknown>) {
  const { data: pays } = await admin
    .from("payments")
    .select("amount_cents")
    .eq("invoice_id", inv.id)
    .eq("status", "succeeded");
  const paid = (pays ?? []).reduce((s: number, p: Record<string, unknown>) => s + Number(p.amount_cents || 0), 0);
  const total = Number(inv.amount_cents || 0);
  return { ...inv, paid_cents: paid, balance_cents: Math.max(0, total - paid) };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const admin = serviceSupabase();
    const { data, error } = await admin
      .from("invoices")
      .select("*, customers(full_name, email)")
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw error;
    const withTotals = await Promise.all((data ?? []).map((inv) => invoiceWithTotals(admin, inv)));
    return NextResponse.json({ ok: true, invoices: withTotals });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const customer_id = String(body.customer_id || "");
    const amount_cents = Math.floor(Number(body.amount_cents || 0));
    if (!customer_id) return NextResponse.json({ ok: false, error: "customer_id required" }, { status: 400 });
    if (!Number.isFinite(amount_cents) || amount_cents < 0) {
      return NextResponse.json({ ok: false, error: "amount_cents must be a non-negative integer" }, { status: 400 });
    }
    const admin = serviceSupabase();
    const year = new Date().getFullYear();
    const { count } = await admin.from("invoices").select("id", { count: "exact", head: true }).like("number", `INV-${year}-%`);
    const number = `INV-${year}-${String((count ?? 0) + 1).padStart(4, "0")}`;
    const { data, error } = await admin
      .from("invoices")
      .insert({
        number,
        customer_id,
        quotation_id: body.quotation_id || null,
        amount_cents,
        currency: String(body.currency || "USD").slice(0, 8),
        due_date: body.due_date || null,
        notes: String(body.notes || "").slice(0, 2000),
        created_by: auth.user.id,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, invoice: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const id = String(body.id || "");
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const patch: Record<string, unknown> = {};
    if (body.status !== undefined) {
      if (!STATUSES.includes(String(body.status))) {
        return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
      }
      // 'paid' cannot be set manually — it is derived from payments.
      if (body.status === "paid" || body.status === "partially_paid") {
        return NextResponse.json(
          { ok: false, error: "paid state is derived from recorded payments, not set manually" },
          { status: 400 },
        );
      }
      patch.status = body.status;
    }
    if (body.notes !== undefined) patch.notes = String(body.notes).slice(0, 2000);
    if (body.due_date !== undefined) patch.due_date = body.due_date || null;
    const admin = serviceSupabase();
    const { data, error } = await admin.from("invoices").update(patch).eq("id", id).select().single();
    if (error) throw error;
    return NextResponse.json({ ok: true, invoice: await invoiceWithTotals(admin, data) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
