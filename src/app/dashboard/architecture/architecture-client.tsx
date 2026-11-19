"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, formatDate, statusLabel, type Lang } from "@/lib/i18n";

export interface ArchitectureDraft {
  summary: string;
  components: string[];
  data_flow: string;
  integrations: string[];
  security: string[];
  risks: string[];
  assumptions: string[];
  phases: string[];
  open_questions: string[];
}

interface SavedDraft {
  id: string;
  title: string;
  status: string;
  created_at: string;
  draft: ArchitectureDraft;
}

const FIELDS: Array<{ key: string; labelKey: string; required?: boolean; hintKey?: string }> = [
  { key: "title", labelKey: "fieldTitle", required: true },
  { key: "goals", labelKey: "fieldGoals", required: true, hintKey: "hintGoals" },
  { key: "features", labelKey: "fieldFeatures", hintKey: "hintFeatures" },
  { key: "platforms", labelKey: "fieldPlatforms", hintKey: "hintPlatforms" },
  { key: "integrations", labelKey: "fieldIntegrations", hintKey: "hintIntegrations" },
  { key: "constraints", labelKey: "fieldConstraints", hintKey: "hintConstraints" },
  { key: "securityNeeds", labelKey: "fieldSecurity" },
  { key: "budgetRange", labelKey: "fieldBudget", hintKey: "hintBudget" },
  { key: "timeline", labelKey: "fieldTimeline", hintKey: "hintTimeline" },
  { key: "serviceDomain", labelKey: "fieldDomain", hintKey: "hintDomain" },
];

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <h4 className="gold" style={{ margin: "0 0 6px" }}>{title}</h4>
      <ul style={{ margin: 0, paddingLeft: 18, fontSize: 14 }}>
        {items.map((x, i) => (
          <li key={i} style={{ marginBottom: 4 }}>{x}</li>
        ))}
      </ul>
    </div>
  );
}

export default function ArchitectureClient({
  lang,
  initialDrafts,
}: {
  lang: Lang;
  initialDrafts: SavedDraft[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<ArchitectureDraft | null>(null);
  const [disclaimer, setDisclaimer] = useState("");
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  function set(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function generate() {
    setError(null);
    setDraft(null);
    if (!form.title?.trim() || form.title.trim().length < 3) {
      setError(t("titleRequired", lang));
      return;
    }
    if (!form.goals?.trim() || form.goals.trim().length < 10) {
      setError(t("goalsRequired", lang));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/ai/architecture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(typeof data?.error === "string" ? data.error : `Request failed (${res.status}).`);
      }
      setDraft(data.draft);
      setDisclaimer(data.disclaimer ?? "");
      setPersisted(data.persisted ?? null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("somethingWrong", lang));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="tile" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t("newDraft", lang)}</h3>
        {FIELDS.map((f) => (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <label htmlFor={`arch-${f.key}`} style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
              {t(f.labelKey, lang)}
            </label>
            {f.key === "goals" || f.key === "features" || f.key === "constraints" ? (
              <textarea
                id={`arch-${f.key}`}
                rows={3}
                value={form[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.hintKey ? t(f.hintKey, lang) : ""}
                disabled={loading}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #c7d0da", background: "#ffffff", color: "#1E293B" }}
              />
            ) : (
              <input
                id={`arch-${f.key}`}
                type="text"
                value={form[f.key] ?? ""}
                onChange={(e) => set(f.key, e.target.value)}
                placeholder={f.hintKey ? t(f.hintKey, lang) : ""}
                disabled={loading}
                style={{ width: "100%", padding: 10, borderRadius: 8, border: "1px solid #c7d0da", background: "#ffffff", color: "#1E293B" }}
              />
            )}
          </div>
        ))}
        {error && (
          <p role="alert" style={{ color: "#b3261e", fontSize: 13 }}>{error}</p>
        )}
        <button className="btn" onClick={generate} disabled={loading}>
          {loading ? t("generating", lang) : t("generateDraft", lang)}
        </button>
      </div>

      {draft && (
        <div className="tile" style={{ marginBottom: 16, borderColor: "#06B6D4" }}>
          <h3 style={{ marginTop: 0 }}>
            {t("draftTitle", lang)} <span className="gold" style={{ fontSize: 12 }}>{t("draftTag", lang)}</span>
          </h3>
          <p style={{ fontSize: 14 }}>{draft.summary}</p>
          <Section title={t("secComponents", lang)} items={draft.components} />
          <div style={{ marginTop: 14 }}>
            <h4 className="gold" style={{ margin: "0 0 6px" }}>{t("secDataFlow", lang)}</h4>
            <p style={{ fontSize: 14, margin: 0 }}>{draft.data_flow}</p>
          </div>
          <Section title={t("secIntegrations", lang)} items={draft.integrations} />
          <Section title={t("secSecurity", lang)} items={draft.security} />
          <Section title={t("secRisks", lang)} items={draft.risks} />
          <Section title={t("secAssumptions", lang)} items={draft.assumptions} />
          <Section title={t("secPhases", lang)} items={draft.phases} />
          <Section title={t("secQuestions", lang)} items={draft.open_questions} />
          <p className="muted" style={{ fontSize: 12, marginTop: 16 }}>{disclaimer}</p>
          {persisted === false && (
            <p className="muted" style={{ fontSize: 12 }}>
              {t("storageNote", lang)}
            </p>
          )}
        </div>
      )}

      <div className="tile">
        <h3 style={{ marginTop: 0 }}>{t("savedDrafts", lang)}</h3>
        {initialDrafts.length === 0 && (
          <p className="muted" style={{ fontSize: 14 }}>{t("noDrafts", lang)}</p>
        )}
        {initialDrafts.map((d) => (
          <div key={d.id} style={{ borderTop: "1px solid #E2E8F0", padding: "10px 0" }}>
            <button
              onClick={() => setOpenId(openId === d.id ? null : d.id)}
              style={{ background: "none", border: "none", color: "#1E293B", cursor: "pointer", fontSize: 14, textAlign: "left", padding: 0 }}
              aria-expanded={openId === d.id}
            >
              <span className="gold">▸</span> {d.title}{" "}
              <span className="muted" style={{ fontSize: 12 }}>
                ({statusLabel(d.status, lang)} · {formatDate(d.created_at, lang)})
              </span>
            </button>
            {openId === d.id && d.draft && (
              <div style={{ marginTop: 8, fontSize: 13 }}>
                <p>{d.draft.summary}</p>
                <Section title={t("secComponents", lang)} items={d.draft.components} />
                <Section title={t("secPhases", lang)} items={d.draft.phases} />
                <Section title={t("secQuestions", lang)} items={d.draft.open_questions} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
