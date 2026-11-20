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
  /** HTTP method — "PATCH" by default; suspend/unsuspend/transfer use "POST". */
  method?: "PATCH" | "POST";
};

/** Generic admin button: PATCHes (or POSTs) `payload` to `endpoint` (with an optional
 *  window.confirm first), then refreshes the page. */
export function AdminActionButton({ endpoint, payload, label, confirmText, method = "PATCH" }: AdminActionButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!confirmText || window.confirm(confirmText)) {
      setBusy(true);
      setError(null);
      try {
        const res = await fetch(endpoint, {
          method,
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

type DeleteUserButtonProps = {
  endpoint: string;
  userId: string;
  label: string;
  /** window.confirm text — the destructive action always asks first. */
  confirmText: string;
};

/**
 * Delete-user button (added 2026-11-20, admin user control): DELETEs
 * { user_id } to `endpoint` after a window.confirm, then refreshes the
 * page. Rendered in red — deletion is permanent. A 409 from the API
 * (business records block the delete) is shown inline with its message.
 */
export function DeleteUserButton({ endpoint, userId, label, confirmText }: DeleteUserButtonProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!window.confirm(confirmText)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        const blockers = (data as { blockers?: Record<string, number> }).blockers;
        const detail = blockers
          ? `: ${Object.entries(blockers)
              .map(([k, v]) => `${k} (${v})`)
              .join(", ")}`
          : "";
        throw new Error(`${data.error || "Delete failed"}${detail}`);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span style={{ display: "inline-flex", flexDirection: "column", gap: 4 }}>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        style={{
          border: "1px solid #dc2626",
          color: "#dc2626",
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
      {error && <span style={{ color: "#e66", fontSize: 11 }}>{String(error).slice(0, 160)}</span>}
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
