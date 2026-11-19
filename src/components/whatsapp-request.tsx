"use client";
import { useState } from "react";
import { buildServiceRequestMessage, serviceRequestLink } from "@/lib/whatsapp-links";

/**
 * WhatsAppRequest — on-site request composer.
 * Visitor enters name + requirements; we open a wa.me deep link with a
 * pre-filled message in THEIR WhatsApp app. Zero cost, no API, no messages
 * are sent by us — the visitor presses send themselves.
 */
export function WhatsAppRequest({
  serviceTitle,
  lang = "en",
}: {
  serviceTitle: string;
  lang?: "en" | "ar";
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [requirement, setRequirement] = useState("");
  const ar = lang === "ar";

  const message = buildServiceRequestMessage({ serviceTitle, lang, name, requirement });
  const link = serviceRequestLink(message);

  return (
    <div style={{ marginTop: 12 }}>
      {!open ? (
        <button className="btn secondary" onClick={() => setOpen(true)}>
          {ar ? "اطلب عبر واتساب" : "Request via WhatsApp"}
        </button>
      ) : (
        <div className="panel" style={{ padding: 18 }}>
          <div className="eyebrow">{ar ? "طلب عبر واتساب" : "WhatsApp request"}</div>
          <p className="muted" style={{ fontSize: 13, margin: "8px 0 14px" }}>
            {ar
              ? "املأ الحقول وسيُفتح واتساب لديك برسالة جاهزة — أنت من يضغط إرسال."
              : "Fill the fields and WhatsApp opens on your device with a ready message — you press send."}
          </p>
          <label className="field" style={{ marginBottom: 10 }}>
            <span>{ar ? "الاسم" : "Name"}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={ar ? "اسمك الكريم" : "Your name"}
              maxLength={80}
            />
          </label>
          <label className="field" style={{ marginBottom: 14 }}>
            <span>{ar ? "ما الذي تحتاجه؟" : "What do you need?"}</span>
            <textarea
              value={requirement}
              onChange={(e) => setRequirement(e.target.value)}
              placeholder={
                ar ? "صف متطلباتك باختصار…" : "Briefly describe your requirements…"
              }
              rows={3}
              maxLength={800}
            />
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <a className="btn" href={link} target="_blank" rel="noopener noreferrer">
              {ar ? "فتح واتساب بالرسالة" : "Open WhatsApp with message"} ↗
            </a>
            <button className="btn secondary" onClick={() => setOpen(false)}>
              {ar ? "إلغاء" : "Cancel"}
            </button>
          </div>
          <p className="muted" style={{ fontSize: 11.5, margin: "10px 0 0" }}>
            {ar
              ? "معاينة الرسالة:"
              : "Message preview:"}
          </p>
          <pre
            className="muted"
            style={{
              fontSize: 12,
              whiteSpace: "pre-wrap",
              background: "rgba(11,36,71,.04)",
              padding: 10,
              borderRadius: 8,
              margin: "6px 0 0",
            }}
          >
            {message}
          </pre>
        </div>
      )}
    </div>
  );
}
