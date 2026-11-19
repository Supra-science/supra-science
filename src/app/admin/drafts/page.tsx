// src/app/admin/drafts/page.tsx — NEW in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_drafts_page_tsx_1l80w7uj9689j._.js`.
// List view: architecture_drafts (newest first, 100) with author name and
// status. Detail view (?id=...): the draft's brief and draft body rendered
// recursively from JSON (string / number / boolean / array / object), a
// StatusChanger (draft / reviewed / converted), and a link to the linked
// project when project_id is set.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel, type Lang } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["draft", "reviewed", "converted"];

/** Render an arbitrary JSON value: strings keep line breaks, arrays become
 *  lists, objects become labelled sections, scalars become plain text. */
function renderValue(value: unknown): React.ReactNode {
  if (value == null) return null;
  if (typeof value === "string") return <p style={{ whiteSpace: "pre-wrap" }}>{value}</p>;
  if (typeof value === "number" || typeof value === "boolean") return <p>{String(value)}</p>;
  if (Array.isArray(value)) {
    return (
      <ul style={{ margin: "4px 0", paddingInlineStart: 20 }}>
        {value.map((item, i) => (
          <li key={i} style={{ fontSize: 14, color: "#39404d" }}>
            {typeof item === "object" ? JSON.stringify(item) : String(item)}
          </li>
        ))}
      </ul>
    );
  }
  if (typeof value === "object") {
    return (
      <div>
        {Object.entries(value as Record<string, unknown>).map(([key, child]) => (
          <div key={key} style={{ marginTop: 10 }}>
            <strong style={{ fontSize: 14 }}>{key.replace(/_/g, " ")}:</strong>
            {renderValue(child)}
          </div>
        ))}
      </div>
    );
  }
  return null;
}

type DraftRow = {
  id: string;
  user_id: string | null;
  title: string;
  status: string;
  project_id: string | null;
  created_at: string;
  profiles?: { full_name?: string | null } | null;
};

export default async function AdminDrafts({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdminPage();
  const lang = await getLang();
  const supabase = getServiceSupabase();
  const { id } = await searchParams;

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("drafts", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  if (id) {
    const { data } = await supabase
      .from("architecture_drafts")
      .select("*, profiles(full_name)")
      .eq("id", id)
      .maybeSingle();
    if (!data) {
      return (
        <main style={page}>
          <Link href="/admin/drafts" style={gold}>
            ← {t("backToList", lang)}
          </Link>
          <p style={{ ...card, marginTop: 16 }}>{t("noData", lang)}</p>
        </main>
      );
    }
    const draft = data as DraftRow & { brief: unknown; draft: unknown };
    const author = draft.profiles ?? {};
    return (
      <main style={page}>
        <Link href="/admin/drafts" style={gold}>
          ← {t("backToList", lang)}
        </Link>
        <h1 style={heading}>{String(draft.title)}</h1>
        <p style={muted}>
          {String(author.full_name || "")} · {formatDate(String(draft.created_at), lang)}
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          <StatusBadge status={String(draft.status)} lang={lang} />
          <StatusChanger
            endpoint="/api/admin/drafts"
            id={String(draft.id)}
            current={String(draft.status)}
            options={STATUSES}
            labels={labels}
            applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
          />
          {draft.project_id ? (
            <Link href={`/admin/projects?id=${String(draft.project_id)}`} style={gold}>
              {t("colProject", lang)}
            </Link>
          ) : null}
        </div>
        <h2 style={{ marginTop: 28 }}>{t("brief", lang)}</h2>
        <div style={card}>{renderValue(draft.brief)}</div>
        <h2 style={{ marginTop: 28 }}>{t("draftBody", lang)}</h2>
        <div style={card}>{renderValue(draft.draft)}</div>
      </main>
    );
  }

  const { data } = await supabase
    .from("architecture_drafts")
    .select("id, user_id, title, status, project_id, created_at, profiles(full_name)")
    .order("created_at", { ascending: false })
    .limit(100);
  const drafts = (data ?? []) as DraftRow[];

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("drafts", lang)} <span style={gold}>({drafts.length})</span>
      </h1>
      <p style={muted}>{t("draftsLead", lang)}</p>
      <div style={{ ...card, marginTop: 24 }}>
        {!drafts.length && <p style={muted}>{t("noData", lang)}</p>}
        {drafts.map((draft) => {
          const author = draft.profiles ?? {};
          return (
            <div
              key={String(draft.id)}
              style={{ ...row, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}
            >
              <div>
                <Link href={`/admin/drafts?id=${String(draft.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                  {String(draft.title)}
                </Link>
                <br />
                <span style={{ ...muted, fontSize: 14 }}>{String(author.full_name || "")}</span>
              </div>
              <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <StatusBadge status={String(draft.status)} lang={lang} />
                <span style={muted}>{formatDate(String(draft.created_at), lang)}</span>
              </span>
            </div>
          );
        })}
      </div>
    </main>
  );
}
