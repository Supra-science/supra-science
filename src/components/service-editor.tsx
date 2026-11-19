"use client";
import { useState } from "react";

export type ServiceRow = Record<string, unknown>;

const TEXT_FIELDS: Array<{ key: string; label: string; rows?: number }> = [
  { key: "title_en", label: "Title (EN)" },
  { key: "title_ar", label: "Title (AR)" },
  { key: "problem_en", label: "Problem (EN)", rows: 2 },
  { key: "problem_ar", label: "Problem (AR)", rows: 2 },
  { key: "description_en", label: "Description (EN)", rows: 3 },
  { key: "description_ar", label: "Description (AR)", rows: 3 },
  { key: "scope_en", label: "Scope (EN) — one item per line", rows: 4 },
  { key: "scope_ar", label: "Scope (AR) — one item per line", rows: 4 },
  { key: "technologies_en", label: "Technologies (EN)" },
  { key: "technologies_ar", label: "Technologies (AR)" },
  { key: "deliverables_en", label: "Deliverables (EN)", rows: 2 },
  { key: "deliverables_ar", label: "Deliverables (AR)", rows: 2 },
  { key: "need_from_you_en", label: "Need from you (EN)", rows: 2 },
  { key: "need_from_you_ar", label: "Need from you (AR)", rows: 2 },
  { key: "examples_en", label: "Typical applications (EN) — one per line", rows: 3 },
  { key: "examples_ar", label: "Typical applications (AR) — one per line", rows: 3 },
];

const LIST_KEYS = new Set(["scope_en", "scope_ar", "examples_en", "examples_ar"]);

function toFormValue(v: unknown, key: string): string {
  if (LIST_KEYS.has(key) && Array.isArray(v)) return v.join("\n");
  return typeof v === "string" ? v : "";
}

function fromFormValue(v: string, key: string): unknown {
  if (LIST_KEYS.has(key)) return v.split("\n").map((x) => x.trim()).filter(Boolean);
  return v;
}

export function ServiceEditor({
  initial,
  onSaved,
  onCancel,
}: {
  initial?: ServiceRow;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const f: Record<string, string> = {};
    for (const { key } of TEXT_FIELDS) f[key] = toFormValue(initial?.[key], key);
    f.slug = typeof initial?.slug === "string" ? initial.slug : "";
    return f;
  });
  const [active, setActive] = useState(initial?.is_active !== false);
  const [order, setOrder] = useState(String(initial?.sort_order ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => setForm((p) => ({ ...p, [k]: e.target.value }));

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const body: Record<string, unknown> = { slug: form.slug };
      for (const { key } of TEXT_FIELDS) body[key] = fromFormValue(form[key], key);
      body.is_active = active;
      body.sort_order = parseInt(order, 10) || 0;
      const isNew = !initial?.id;
      const res = await fetch("/api/admin/services", {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isNew ? body : { id: initial.id, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      if (!data.ok) throw new Error(data.error || "Save failed");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <h3>{initial?.id ? "Edit service" : "New service"}</h3>
      <div className="tiles-2">
        <label className="field">
          <span>Slug (URL id)</span>
          <input value={form.slug} onChange={set("slug")} placeholder="auto from English title" dir="ltr" />
        </label>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-end", paddingBottom: 8 }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 14 }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Visible on website
          </label>
          <label className="field" style={{ maxWidth: 120 }}>
            <span>Order</span>
            <input type="number" value={order} onChange={(e) => setOrder(e.target.value)} dir="ltr" />
          </label>
        </div>
      </div>
      <div className="tiles-2" style={{ marginTop: 4 }}>
        {TEXT_FIELDS.map(({ key, label, rows }) => (
          <label className="field" key={key}>
            <span>{label}</span>
            {rows ? (
              <textarea rows={rows} value={form[key]} onChange={set(key)} dir={key.endsWith("_ar") ? "rtl" : "ltr"} />
            ) : (
              <input value={form[key]} onChange={set(key)} dir={key.endsWith("_ar") ? "rtl" : "ltr"} />
            )}
          </label>
        ))}
      </div>
      {error && <p style={{ color: "#b3261e", fontSize: 13 }}>{error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button className="btn" disabled={saving} onClick={save}>
          {saving ? "Saving…" : "Save service"}
        </button>
        <button className="btn secondary" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

export function ServiceList({ initial }: { initial: ServiceRow[] }) {
  const [items, setItems] = useState<ServiceRow[]>(initial);
  const [editing, setEditing] = useState<ServiceRow | null | "new">(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/services");
    const data = await res.json().catch(() => ({}));
    if (data.ok) setItems(data.services);
    setEditing(null);
  }

  async function toggleActive(s: ServiceRow) {
    const res = await fetch("/api/admin/services", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, is_active: !s.is_active }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) refresh();
    else setError(data.error || "Update failed");
  }

  async function remove(s: ServiceRow) {
    if (!confirm(`Delete "${String(s.title_en)}"? This cannot be undone.`)) return;
    const res = await fetch("/api/admin/services", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.ok) refresh();
    else setError(data.error || "Delete failed");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <h2 style={{ fontSize: 22, margin: 0 }}>Services ({items.length})</h2>
        <button className="btn" onClick={() => setEditing("new")}>+ New service</button>
      </div>
      {error && <p style={{ color: "#b3261e" }}>{error}</p>}
      {editing && (
        <ServiceEditor
          initial={editing === "new" ? undefined : editing}
          onSaved={refresh}
          onCancel={() => setEditing(null)}
        />
      )}
      <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
        {items.map((s) => (
          <div key={String(s.id)} className="panel" style={{ padding: 16, display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <strong>{String(s.title_en)}</strong>
              <span className="muted"> · {String(s.title_ar)}</span>
              <div className="muted" style={{ fontSize: 12 }}>
                slug: <span dir="ltr">{String(s.slug)}</span> · order {String(s.sort_order)} ·{" "}
                <span style={{ color: s.is_active ? "#166534" : "#b3261e" }}>
                  {s.is_active ? "visible" : "hidden"}
                </span>
              </div>
            </div>
            <button className="btn secondary" onClick={() => setEditing(s)}>Edit</button>
            <button className="btn secondary" onClick={() => toggleActive(s)}>
              {s.is_active ? "Hide" : "Show"}
            </button>
            <button className="btn secondary" onClick={() => remove(s)} style={{ color: "#b3261e" }}>
              Delete
            </button>
          </div>
        ))}
        {!items.length && (
          <p className="muted">No services yet. Apply migration 007, or create the first service here.</p>
        )}
      </div>
    </div>
  );
}
