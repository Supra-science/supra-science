"use client";
import { useState } from "react";

export type Invoice = Record<string, unknown> & {
  customers?: { full_name?: string; email?: string } | null;
};

const STATUSES = ["draft", "sent", "overdue", "cancelled"];
const METHODS = ["bank_transfer", "stripe_test", "cash", "other"];

function money(cents: number, currency: string) {
  return `${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`;
}

export function InvoiceManager({
  initial,
  customers,
}: {
  initial: Invoice[];
  customers: Array<{ id: string; full_name: string; email: string }>;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>(initial);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [payFor, setPayFor] = useState<Invoice | null>(null);

  // new invoice form
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [due, setDue] = useState("");
  const [notes, setNotes] = useState("");

  // payment form
  const [pAmount, setPAmount] = useState("");
  const [pMethod, setPMethod] = useState("bank_transfer");
  const [pRef, setPRef] = useState("");
  const [pNotes, setPNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/admin/invoices");
    const data = await res.json().catch(() => ({}));
    if (data.ok) setInvoices(data.invoices);
    setShowNew(false);
    setPayFor(null);
  }

  async function createInvoice() {
    setBusy(true);
    setError(null);
    try {
      const cents = Math.round(parseFloat(amount) * 100);
      if (!customerId || !Number.isFinite(cents) || cents < 0) throw new Error("Choose a customer and a valid amount.");
      if (due) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(due)) throw new Error("Enter the due date as YYYY-MM-DD.");
        const [y, m, d] = due.split("-").map(Number);
        const dt = new Date(y, m - 1, d);
        if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) throw new Error("Enter a real calendar date (YYYY-MM-DD).");
      }
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer_id: customerId, amount_cents: cents, currency, due_date: due || null, notes }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.error || "Create failed");
      setAmount(""); setNotes(""); setDue("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(false);
    }
  }

  async function recordPayment() {
    if (!payFor) return;
    setBusy(true);
    setError(null);
    try {
      const cents = Math.round(parseFloat(pAmount) * 100);
      if (!Number.isFinite(cents) || cents <= 0) throw new Error("Enter a positive amount.");
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_id: payFor.id,
          amount_cents: cents,
          method: pMethod,
          reference: pRef,
          notes: pNotes,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.error || "Payment failed");
      setPAmount(""); setPRef(""); setPNotes("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed");
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(inv: Invoice, status: string) {
    const res = await fetch("/api/admin/invoices", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: inv.id, status }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) refresh();
    else setError(data.error || "Status update failed");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>Invoices ({invoices.length})</h2>
        <button className="btn" onClick={() => setShowNew((v) => !v)}>
          {showNew ? "Close" : "+ New invoice"}
        </button>
      </div>
      {error && <p style={{ color: "#b3261e" }}>{error}</p>}

      {showNew && (
        <div className="panel" style={{ marginTop: 14 }}>
          <h3>New invoice</h3>
          <div className="tiles-2">
            <label className="field">
              <span>Customer</span>
              <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} — {c.email}</option>
                ))}
              </select>
            </label>
            <div style={{ display: "flex", gap: 10 }}>
              <label className="field" style={{ flex: 2 }}>
                <span>Amount</span>
                <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} dir="ltr" placeholder="0.00" />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span>Currency</span>
                <input value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} maxLength={8} dir="ltr" />
              </label>
            </div>
            <label className="field">
              <span>Due date</span>
              <input type="text" inputMode="numeric" placeholder="YYYY-MM-DD" autoComplete="off" value={due} onChange={(e) => setDue(e.target.value.replace(/[^0-9-]/g, "").slice(0, 10))} dir="ltr" lang="en" />
            </label>
            <label className="field">
              <span>Notes</span>
              <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
            </label>
          </div>
          <button className="btn" disabled={busy} onClick={createInvoice} style={{ marginTop: 12 }}>
            {busy ? "Creating…" : "Create invoice"}
          </button>
        </div>
      )}

      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {invoices.map((inv) => {
          const cur = String(inv.currency || "USD");
          return (
            <div key={String(inv.id)} className="panel" style={{ padding: 16 }}>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                <strong dir="ltr">{String(inv.number)}</strong>
                <span className="gold" style={{ fontSize: 12, padding: "3px 10px", border: "1px solid var(--gold)", borderRadius: 20 }}>
                  {String(inv.status)}
                </span>
                <span style={{ flex: 1 }} />
                <span className="muted" style={{ fontSize: 13 }}>
                  {inv.customers?.full_name} · {inv.customers?.email}
                </span>
              </div>
              <div className="tiles" style={{ marginTop: 10 }}>
                <div className="stat"><strong>{money(Number(inv.amount_cents || 0), cur)}</strong><span>Total</span></div>
                <div className="stat"><strong style={{ color: "#166534" }}>{money(Number(inv.paid_cents || 0), cur)}</strong><span>Paid (verified)</span></div>
                <div className="stat"><strong style={{ color: "#6366F1" }}>{money(Number(inv.balance_cents || 0), cur)}</strong><span>Balance</span></div>
                <div className="stat"><strong>{inv.due_date ? String(inv.due_date) : "—"}</strong><span>Due</span></div>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12 }}>
                <button className="btn secondary" onClick={() => { setPayFor(inv); setPAmount(""); }}>
                  Record payment
                </button>
                {STATUSES.filter((s) => s !== inv.status).map((s) => (
                  <button key={s} className="btn secondary" onClick={() => setStatus(inv, s)}>
                    Mark {s}
                  </button>
                ))}
              </div>
              {payFor?.id === inv.id && (
                <div className="panel" style={{ marginTop: 12, borderStyle: "dashed" }}>
                  <h4 style={{ margin: "0 0 10px" }}>
                    Record payment — <span dir="ltr">{String(inv.number)}</span>
                  </h4>
                  <p className="muted" style={{ fontSize: 12.5, margin: "0 0 12px" }}>
                    Record only money you have actually received. The invoice status
                    updates automatically from real totals.
                  </p>
                  <div className="tiles-2">
                    <label className="field">
                      <span>Amount received</span>
                      <input type="number" min="0.01" step="0.01" value={pAmount} onChange={(e) => setPAmount(e.target.value)} dir="ltr" placeholder="0.00" />
                    </label>
                    <label className="field">
                      <span>Method</span>
                      <select value={pMethod} onChange={(e) => setPMethod(e.target.value)}>
                        {METHODS.map((m) => <option key={m} value={m}>{m.replace("_", " ")}</option>)}
                      </select>
                    </label>
                    <label className="field">
                      <span>Reference (transfer id, receipt…)</span>
                      <input value={pRef} onChange={(e) => setPRef(e.target.value)} maxLength={200} dir="ltr" />
                    </label>
                    <label className="field">
                      <span>Notes</span>
                      <input value={pNotes} onChange={(e) => setPNotes(e.target.value)} maxLength={500} />
                    </label>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn" disabled={busy} onClick={recordPayment}>
                      {busy ? "Recording…" : "Confirm payment received"}
                    </button>
                    <button className="btn secondary" onClick={() => setPayFor(null)}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {!invoices.length && (
          <p className="muted">No invoices yet. Apply migration 008, then create the first invoice above.</p>
        )}
      </div>
    </div>
  );
}
