// src/app/api/admin/payments/route.ts — PRE-EXISTING in Nov-5; CHANGED in
// the Nov-8 live build (live userland module 95364 in chunk
// `_17zhx_3g-k6lc._.js`).
// CHANGE vs Nov-5: the allowed payment methods are now only
// ["bank_transfer", "cash", "other"] — Nov-5 also accepted "stripe_test"
// (error: "method must be bank_transfer, stripe_test, cash or other").
// That matches the decision to remove Stripe. Everything else — validation,
// invoice lookup, the cancelled-invoice guard, inserting a "succeeded"
// payment, and recomputing the invoice status from real totals — is
// unchanged. This is the ONLY way money is recorded; it does NOT write an
// audit row.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, serviceSupabase } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const METHODS = ["bank_transfer", "cash", "other"];

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const invoice_id = String(body.invoice_id || "");
    const amount_cents = Math.floor(Number(body.amount_cents || 0));
    const method = String(body.method || "");
    if (!invoice_id) return NextResponse.json({ ok: false, error: "invoice_id required" }, { status: 400 });
    if (!Number.isFinite(amount_cents) || amount_cents <= 0) {
      return NextResponse.json({ ok: false, error: "amount_cents must be a positive integer" }, { status: 400 });
    }
    if (!METHODS.includes(method)) {
      return NextResponse.json({ ok: false, error: "method must be bank_transfer, cash or other" }, { status: 400 });
    }

    const admin = serviceSupabase();
    const { data: invoice, error: invError } = await admin.from("invoices").select("*").eq("id", invoice_id).single();
    if (invError || !invoice) return NextResponse.json({ ok: false, error: "invoice not found" }, { status: 404 });
    if (invoice.status === "cancelled") {
      return NextResponse.json({ ok: false, error: "cannot record payment on a cancelled invoice" }, { status: 400 });
    }

    const { data: payment, error } = await admin
      .from("payments")
      .insert({
        invoice_id,
        customer_id: invoice.customer_id,
        quotation_id: invoice.quotation_id,
        amount_cents,
        currency: invoice.currency,
        status: "succeeded",
        method,
        reference: String(body.reference || "").slice(0, 200),
        notes: String(body.notes || "").slice(0, 1000),
        recorded_by: auth.user.id,
        received_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (error) throw error;

    // Recompute invoice status from real totals.
    const { data: pays } = await admin
      .from("payments")
      .select("amount_cents")
      .eq("invoice_id", invoice_id)
      .eq("status", "succeeded");
    const paidTotal = (pays ?? []).reduce((s: number, p: Record<string, unknown>) => s + Number(p.amount_cents || 0), 0);
    const total = Number(invoice.amount_cents || 0);
    const newStatus = paidTotal >= total && total > 0 ? "paid" : paidTotal > 0 ? "partially_paid" : invoice.status;
    if (newStatus !== invoice.status) {
      await admin.from("invoices").update({ status: newStatus }).eq("id", invoice_id);
    }
    return NextResponse.json({
      ok: true,
      payment,
      invoice_status: newStatus,
      paid_cents: paidTotal,
      balance_cents: Math.max(0, total - paidTotal),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "failed";
    return NextResponse.json({ ok: false, error: msg.slice(0, 160) }, { status: 503 });
  }
}
