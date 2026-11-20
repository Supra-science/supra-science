// src/app/admin/whatsapp/page.tsx — NEW in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_whatsapp_page_tsx_1o354l2n6l6wo._.js`.
// List view: whatsapp_conversations (by updated_at desc, 100) with the
// latest message preview per conversation (one extra query, newest message
// per conversation, 200 rows). Detail view (?id=...): the conversation
// header (phone, customer, service, status changer open/pending/closed)
// and its messages oldest-first (200), each with direction, type, template
// name, delivery status and date; bodies truncated to 1000 chars.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t, formatDate, statusLabel } from "@/lib/i18n";
import { page, heading, card, row, gold, muted } from "@/lib/admin-styles";
import { StatusBadge } from "@/components/status-badge";
import { StatusChanger } from "@/components/admin-actions";

export const dynamic = "force-dynamic";

const STATUSES = ["open", "pending", "closed"];

type Conversation = {
  id: string;
  phone_e164: string;
  service_key: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  customers?: { full_name?: string | null; email?: string | null } | null;
};

type WhatsAppMessage = {
  id: string;
  conversation_id?: string;
  direction: string;
  message_type: string | null;
  body: string | null;
  template_name: string | null;
  status: string | null;
  created_at: string;
};

export default async function AdminWhatsApp({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  await requireAdminPage("whatsapp:manage");
  const lang = await getLang();
  const supabase = getServiceSupabase();
  const { id } = await searchParams;

  if (!supabase) {
    return (
      <main style={page}>
        <h1 style={heading}>{t("whatsapp", lang)}</h1>
        <p style={{ ...card, border: "1px solid #a33", marginTop: 16 }}>{t("dbNotConfigured", lang)}</p>
      </main>
    );
  }

  const labels: Record<string, string> = {};
  for (const status of STATUSES) labels[status] = statusLabel(status, lang);

  if (id) {
    const [{ data: conversation }, { data: messages }] = await Promise.all([
      supabase.from("whatsapp_conversations").select("*, customers(full_name, email)").eq("id", id).maybeSingle(),
      supabase
        .from("whatsapp_messages")
        .select("id, direction, message_type, body, template_name, status, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true })
        .limit(200),
    ]);
    if (!conversation) {
      return (
        <main style={page}>
          <Link href="/admin/whatsapp" style={gold}>
            ← {t("backToList", lang)}
          </Link>
          <p style={{ ...card, marginTop: 16 }}>{t("noData", lang)}</p>
        </main>
      );
    }
    const conv = conversation as Conversation;
    const customer = conv.customers ?? {};
    const msgs = (messages ?? []) as WhatsAppMessage[];
    return (
      <main style={page}>
        <Link href="/admin/whatsapp" style={gold}>
          ← {t("backToList", lang)}
        </Link>
        <h1 style={heading}>{String(conv.phone_e164)}</h1>
        <p style={muted}>
          {customer.full_name ? `${String(customer.full_name)} · ` : ""}
          {conv.service_key ? `${String(conv.service_key)} · ` : ""}
          {formatDate(String(conv.updated_at), lang)}
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginTop: 12 }}>
          <StatusBadge status={String(conv.status)} lang={lang} />
          <StatusChanger
            endpoint="/api/admin/whatsapp"
            id={String(conv.id)}
            current={String(conv.status)}
            options={STATUSES}
            labels={labels}
            applyLabel={lang === "ar" ? "تطبيق" : "Apply"}
          />
        </div>
        <h2 style={{ marginTop: 28 }}>{t("conversationMessages", lang)}</h2>
        <div style={card}>
          {!msgs.length && <p style={muted}>{t("noData", lang)}</p>}
          {msgs.map((msg) => (
            <div key={String(msg.id)} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 12, color: String(msg.direction) === "inbound" ? "#6366F1" : "#5a6470" }}>
                  {String(msg.direction) === "inbound" ? t("inbound", lang) : t("outbound", lang)}
                  {msg.message_type ? ` · ${String(msg.message_type)}` : ""}
                  {msg.template_name ? ` · ${String(msg.template_name)}` : ""}
                </span>
                <span style={muted}>
                  {msg.status ? `${String(msg.status)} · ` : ""}
                  {formatDate(String(msg.created_at), lang)}
                </span>
              </div>
              <p style={{ margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{String(msg.body || "").slice(0, 1000)}</p>
            </div>
          ))}
        </div>
      </main>
    );
  }

  const { data } = await supabase
    .from("whatsapp_conversations")
    .select("id, phone_e164, service_key, status, created_at, updated_at, customers(full_name)")
    .order("updated_at", { ascending: false })
    .limit(100);
  const conversations = (data ?? []) as Conversation[];

  // Newest message per conversation (first row per conversation wins, the
  // query is ordered newest-first).
  const lastByConversation = new Map<string, WhatsAppMessage>();
  if (conversations.length) {
    const { data: latest } = await supabase
      .from("whatsapp_messages")
      .select("conversation_id, body, direction, created_at")
      .in("conversation_id", conversations.map((c) => String(c.id)))
      .order("created_at", { ascending: false })
      .limit(200);
    for (const msg of (latest ?? []) as WhatsAppMessage[]) {
      const key = String(msg.conversation_id);
      if (!lastByConversation.has(key)) lastByConversation.set(key, msg);
    }
  }

  return (
    <main style={page}>
      <h1 style={heading}>
        {t("whatsapp", lang)} <span style={gold}>({conversations.length})</span>
      </h1>
      <p style={muted}>{t("whatsappLead", lang)}</p>
      <div style={{ ...card, marginTop: 24 }}>
        {!conversations.length && <p style={muted}>{t("noData", lang)}</p>}
        {conversations.map((conv) => {
          const customer = conv.customers ?? {};
          const last = lastByConversation.get(String(conv.id));
          return (
            <div key={String(conv.id)} style={row}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                <Link href={`/admin/whatsapp?id=${String(conv.id)}`} style={{ color: "#6366F1", fontWeight: 600 }}>
                  {String(conv.phone_e164)}
                </Link>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={muted}>{String(customer.full_name || "")}</span>
                  <StatusBadge status={String(conv.status)} lang={lang} />
                  <span style={muted}>{formatDate(String(conv.updated_at), lang)}</span>
                </span>
              </div>
              {last ? (
                <p style={{ ...muted, fontSize: 13, margin: "6px 0 0" }}>
                  {t("lastMessage", lang)}: {String(last.body || "").slice(0, 140)}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
