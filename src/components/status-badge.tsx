// src/components/status-badge.tsx — RECONSTRUCTED from the Nov-8 2026 live Cloudflare Workers bundle.
// Bundle evidence: module 17333 in chunk
// `.open-next/server-functions/default/.next/server/chunks/ssr/[root-of-the-server]__1t2p_2dwwe4f8._.js`:
// a server component rendering <span style={statusStyle(status)}>{statusLabel(status, lang)}</span>.
// Used by every admin list/detail page as <StatusBadge status lang />.
// TODO(RECONSTRUCTION-GAP): the bundle chunk carries no "[project]/src/..."
// label for this module, so the original filename is not recoverable from
// the bundle. It is NOT part of admin-actions.tsx (that file's client
// references register only AdminActionButton and StatusChanger), so it lived
// in its own server-component file; "status-badge.tsx" and the component
// name "StatusBadge" are reconstruction-time names. The rendering is exact.

import { statusStyle } from "@/lib/admin-styles";
import { statusLabel, type Lang } from "@/lib/i18n";

export function StatusBadge({ status, lang }: { status: string; lang: Lang }) {
  return <span style={statusStyle(status)}>{statusLabel(status, lang)}</span>;
}
