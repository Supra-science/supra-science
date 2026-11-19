// src/lib/admin-styles.ts — RECONSTRUCTED from the Nov-8 2026 live Cloudflare Workers bundle.
// Bundle evidence: module 56805 in chunk
// `.open-next/server-functions/default/.next/server/chunks/ssr/_1w91lpz-x_y1x._.js`
// (same chunk as the admin page guard, module 44119). Shared by every admin
// page: the navy/cyan layout styles, the money formatter and the status
// badge colours.
// TODO(RECONSTRUCTION-GAP): the bundle chunk carries no "[project]/src/..."
// label for this module, so the original filename is not recoverable from
// the bundle. "admin-styles.ts" is a reconstruction-time name; the values
// below are exact.

import type { CSSProperties } from "react";

/** Tech-blue accent text (count badges, links). */
export const gold: CSSProperties = { color: "#6366F1" };

/** Muted grey text. */
export const muted: CSSProperties = { color: "#5a6470" };

/** Admin page shell. */
export const page: CSSProperties = {
  background: "#F8FAFC",
  color: "#0B132B",
  minHeight: "100vh",
  padding: 32,
};

/** Light card panel. */
export const card: CSSProperties = { background: "#ffffff", border: "1px solid #E2E8F0", borderRadius: 8, padding: 16 };

/** One list row inside a card. */
export const row: CSSProperties = { padding: "12px 0", borderBottom: "1px solid #E2E8F0" };

/** Page heading. */
export const heading: CSSProperties = { fontSize: 32, marginTop: 16 };

/** Format an amount stored in cents, e.g. 350000 USD -> "3,500.00 USD". */
export function formatMoney(amountCents: number, currency = "USD"): string {
  return `${(amountCents / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })} ${currency}`;
}

const GREEN_STATUSES = new Set([
  "succeeded",
  "paid",
  "approved",
  "completed",
  "reviewed",
  "converted",
  "read",
  "replied",
]);

const RED_STATUSES = new Set([
  "failed",
  "rejected",
  "cancelled",
  "overdue",
  "expired",
  "closed",
  "archived",
]);

const AMBER_STATUSES = new Set([
  "new",
  "pending",
  "sent",
  "open",
  "draft",
  "partially_paid",
  "in_progress",
  "new_inquiry",
  "consultation",
  "requirements",
  "quotation",
  "awaiting_payment",
  "review",
]);

/** Pill style for a status value: green = done/good, red = bad/ended, amber = in flight. */
export function statusStyle(status: string): CSSProperties {
  const base: CSSProperties = { fontSize: 11, padding: "2px 8px", borderRadius: 10 };
  if (GREEN_STATUSES.has(status)) return { ...base, background: "#dcfce7", color: "#166534" };
  if (RED_STATUSES.has(status)) return { ...base, background: "#fee2e2", color: "#991b1b" };
  if (AMBER_STATUSES.has(status)) return { ...base, background: "#fef3c7", color: "#6366F1" };
  return { ...base, background: "#e5e7eb", color: "#5a6470" };
}
