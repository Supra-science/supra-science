// src/app/admin/integrations/page.tsx — REWRITTEN in the Nov-8 2026 live build.
// Reconstructed from chunk `src_app_admin_integrations_page_tsx_00ixf9bnsouol._.js`.
// Nov-5 version hard-coded its own status colours and copy; the live
// version uses requireAdminPage + getServiceSupabase + i18n and computes
// each integration's status server-side from env configuration only —
// secret values are never displayed. Supabase is always shown Connected
// with the project hostname taken from the (public) project URL.

import Link from "next/link";
import { requireAdminPage, getServiceSupabase } from "@/lib/admin-page";
import { getLang } from "@/lib/lang-server";
import { t } from "@/lib/i18n";
import { page, heading, card, gold, muted } from "@/lib/admin-styles";

export const dynamic = "force-dynamic";

const SUPABASE_HOST = new URL("https://ityzbuncztwgtxudcobr.supabase.co").hostname;

/**
 * Live Supabase health check (added 2026-11-13, audit finding #5).
 * Runs a cheap head-only query through the service-role client with a
 * 5s timeout. Returns ok only when the database actually answers —
 * the old code hard-coded "Connected" without any check.
 * Error text is truncated; secret values are never displayed.
 */
async function checkSupabase(): Promise<{ ok: boolean; detail: string }> {
  const admin = getServiceSupabase();
  if (!admin) {
    return { ok: false, detail: "Service credentials not configured" };
  }
  try {
    const { error } = (await Promise.race([
      admin.from("services").select("id", { count: "exact", head: true }).limit(1),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout after 5s")), 5000),
      ),
    ])) as { error: { message?: string } | null };
    if (error) {
      const msg = typeof error.message === "string" ? error.message.slice(0, 120) : "unknown error";
      return { ok: false, detail: `Database check failed: ${msg}` };
    }
    return { ok: true, detail: `Live check passed (${SUPABASE_HOST})` };
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 120) : "unknown error";
    return { ok: false, detail: `Database check failed: ${msg}` };
  }
}

const STATUS_COLOR: Record<string, string> = {
  Connected: "#10B981",
  Pending: "#6366F1",
  Failed: "#ef4444",
};

type Integration = { name: string; status: "Connected" | "Pending" | "Failed"; detail: string; docs: string };

export default async function AdminIntegrations() {
  await requireAdminPage();
  const lang = await getLang();

  const items: Integration[] = [];
  const supabaseCheck = await checkSupabase();
  items.push({
    name: "Supabase (Database + Auth)",
    status: supabaseCheck.ok ? "Connected" : "Failed",
    detail: supabaseCheck.detail,
    docs: "files/supabase/SETUP-GUIDE.md",
  });
  const whatsappToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const whatsappVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const whatsappAppSecret = process.env.WHATSAPP_APP_SECRET;
  items.push({
    name: "WhatsApp Business Cloud API",
    status: whatsappToken && whatsappPhoneId ? "Connected" : "Pending",
    detail:
      whatsappToken && whatsappPhoneId
        ? `Phone Number ID configured${whatsappVerifyToken ? "; webhook verify token set" : "; webhook verify token missing"}${whatsappAppSecret ? "; app secret set" : "; app secret missing (webhook signatures unverifiable)"}`
        : "Need: Phone Number ID, Access Token, Verify Token, App Secret (see setup guide)",
    docs: "files/whatsapp/SETUP-GUIDE.md",
  });
  const openaiKey = process.env.OPENAI_API_KEY;
  items.push({
    name: "OpenAI (AI Assistant)",
    status: openaiKey ? "Connected" : "Pending",
    detail: openaiKey ? "API key configured (server-side only)" : "Set OPENAI_API_KEY via secure env (never in chat, never NEXT_PUBLIC)",
    docs: "files/openai/SETUP-GUIDE.md",
  });

  const connected = items.filter((i) => i.status === "Connected").length;
  const statusLabel: Record<string, string> = {
    Connected: lang === "ar" ? "متصل" : "Connected",
    Pending: lang === "ar" ? "بانتظار" : "Pending",
    Failed: lang === "ar" ? "فاشل" : "Failed",
  };

  return (
    <main style={page}>
      <Link href="/admin" style={gold}>
        ← {t("backToAdmin", lang)}
      </Link>
      <h1 style={heading}>
        {t("integrations", lang)} <span style={gold}>({connected}/{items.length})</span>
      </h1>
      <p style={muted}>
        {lang === "ar"
          ? "حالة Supabase تُفحص مباشرة من قاعدة البيانات؛ باقي الحالات تُحسب من إعدادات الخادم. لا تظهر قيم الأسرار أبداً."
          : "Supabase status is checked live against the database; other statuses are computed server-side from environment configuration. Secret values are never displayed."}
      </p>
      <div style={{ marginTop: 24, display: "grid", gap: 16 }}>
        {items.map((item) => (
          <div key={item.name} style={{ ...card, borderInlineStart: `4px solid ${STATUS_COLOR[item.status]}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{item.name}</h3>
              <span
                style={{ background: STATUS_COLOR[item.status], color: "#000", padding: "4px 12px", borderRadius: 12, fontSize: 12, fontWeight: "bold" }}
              >
                {statusLabel[item.status].toUpperCase()}
              </span>
            </div>
            <p style={{ color: "#39404d", fontSize: 14, marginTop: 8 }}>{item.detail}</p>
            <p style={{ color: "#94a3b8", fontSize: 12, marginTop: 4 }}>Setup guide: {item.docs}</p>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 24, padding: 16, ...card, borderInlineStart: "4px solid #6366F1" }}>
        <h3>
          {lang === "ar" ? "ضمانات وضع الاختبار" : "Test mode guarantees"}
        </h3>
        <ul style={{ color: "#39404d", fontSize: 14 }}>
          <li>
            {lang === "ar"
              ? "واتساب: لا رسائل حقيقية للعملاء دون اختبارك وموافقتك."
              : "WhatsApp: no real customer messages without your test and approval."}
          </li>
          <li>
            {lang === "ar"
              ? "OpenAI: المفتاح على الخادم فقط، ولا يظهر للمتصفح أبداً."
              : "OpenAI: key is server-side only, never exposed to the browser."}
          </li>
        </ul>
      </div>
    </main>
  );
}
