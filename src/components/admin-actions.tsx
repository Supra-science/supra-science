// src/components/admin-actions.tsx — RECONSTRUCTED from the Nov-8 2026 live Cloudflare Workers bundle.
// Bundle evidence: module 86031 in chunk
// `.open-next/server-functions/default/.next/server/chunks/ssr/_0k4nqlv1dru4p._.js`,
// registered client references "AdminActionButton" and "StatusChanger" for
// "[project]/src/components/admin-actions.tsx". NEW in Nov-8 (no equivalent
// in the Nov-5 base). Both components PATCH an admin API endpoint and then
// refresh the page; failures are shown inline under the control.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AdminActionButtonProps = {
  endpoint: string;
  payload: Record<string, unknown>;
  label: string;
  confirmText?: string;
};

/** Generic admin button: PATCHes `payload` to `endpoint` (with an optional
 *  window.confirm first), then refreshes the page. */
export function AdminActionButton({ endpoint, payload, label, confirmText }: AdminActionButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!confirmText || window.confirm(confirmText)) {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.error || "Update failed");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{
          border: "1px solid #6366F1",
          color: "#6366F1",
          background: "transparent",
          padding: "6px 12px",
          borderRadius: 6,
          cursor: busy ? "wait" : "pointer",
          fontSize: 12,
          opacity: busy ? 0.6 : 1,
        }}
      >
        {busy ? "…" : label}
      </button>
      {error && <span style={{ color: "#e66", fontSize: 11 }}>{String(error).slice(0, 120)}</span>}
    </span>
  );
}

type StatusChangerProps = {
  endpoint: string;
  id: string;
  current: string;
  options: string[];
  labels: Record<string, string>;
  applyLabel: string;
};

/** Status dropdown + Apply button. PATCHes { id, status } to `endpoint`
 *  and refreshes the page; the button is disabled until the selection
 *  differs from the current status. */
export function StatusChanger({ endpoint, id, current, options, labels, applyLabel }: StatusChangerProps) {
  const router = useRouter();
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function apply() {
    if (value !== current) {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(endpoint, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, status: value }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.error || "Update failed");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Update failed");
      } finally {
        setBusy(false);
      }
    }
  }

  return (
    <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <select
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={busy}
        style={{ background: "#ffffff", color: "#0B132B", border: "1px solid #555", borderRadius: 6, padding: "6px 8px", fontSize: 12 }}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option] ?? option}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={apply}
        disabled={busy || value === current}
        style={{
          border: "1px solid #6366F1",
          color: "#6366F1",
          background: "transparent",
          padding: "6px 12px",
          borderRadius: 6,
          cursor: busy || value === current ? "default" : "pointer",
          fontSize: 12,
          opacity: busy || value === current ? 0.5 : 1,
        }}
      >
        {applyLabel}
      </button>
      {error && <span style={{ color: "#e66", fontSize: 11 }}>{String(error).slice(0, 120)}</span>}
    </span>
  );
}
