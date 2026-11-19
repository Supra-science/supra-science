"use client";

import { useEffect, useRef, useState } from "react";
import { t, type Lang } from "@/lib/i18n";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const CONV_KEY = "ss-ai-conversation-id";
const MAX_LEN = 4000;

async function postAssistant(text: string, conversationId: string | null) {
  const res = await fetch("/api/ai/assistant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text, conversation_id: conversationId }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      typeof data?.error === "string" ? data.error : `Request failed (${res.status}).`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return data;
}

export default function ChatClient({ lang }: { lang: Lang }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  // Lazy initializer reads the persisted conversation without an effect
  // (SSR-safe: localStorage is absent on the server).
  const [conversationId, setConversationId] = useState<string | null>(() => {
    try {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(CONV_KEY);
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    if (text.length > MAX_LEN) {
      setError(t("messageTooLong", lang));
      return;
    }
    setError(null);
    setLoading(true);
    const userMsg: ChatMessage = { role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    try {
      let data;
      try {
        data = await postAssistant(text, conversationId);
      } catch (e) {
        // A conversation id saved by an older session may no longer exist
        // (or belong to another account) — the API answers 404 "Conversation
        // not found". Drop the stale id and start a fresh conversation once
        // instead of failing every message with that error.
        const stale =
          e instanceof Error &&
          ((e as Error & { status?: number }).status === 404 ||
            e.message === "Conversation not found");
        if (!stale) throw e;
        setConversationId(null);
        try {
          localStorage.removeItem(CONV_KEY);
        } catch {
          /* ignore */
        }
        data = await postAssistant(text, null);
      }
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
      if (typeof data.conversation_id === "string") {
        setConversationId(data.conversation_id);
        try {
          localStorage.setItem(CONV_KEY, data.conversation_id);
        } catch {
          /* ignore */
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("somethingWrong", lang));
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setMessages([]);
    setConversationId(null);
    setError(null);
    try {
      localStorage.removeItem(CONV_KEY);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="tile" style={{ maxWidth: 760 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>{t("aiAssistant", lang)}</h3>
        <button className="btn secondary" onClick={newConversation} disabled={loading}>
          {t("newConversation", lang)}
        </button>
      </div>

      <div
        aria-live="polite"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          minHeight: 220,
          maxHeight: 420,
          overflowY: "auto",
          padding: 12,
          border: "1px solid #E2E8F0",
          borderRadius: 8,
          background: "#ffffff",
          marginBottom: 12,
        }}
      >
        {messages.length === 0 && !loading && (
          <p className="muted" style={{ margin: 0 }}>
            {t("chatEmpty", lang)}
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              alignSelf: m.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "85%",
              padding: "8px 12px",
              borderRadius: 8,
              background: m.role === "user" ? "#dcebf5" : "#ffffff",
              border: m.role === "user" ? "1px solid #c7d0da" : "1px solid #06B6D4",
              whiteSpace: "pre-wrap",
              fontSize: 14,
            }}
          >
            {m.role === "assistant" && (
              <div className="gold" style={{ fontSize: 11, marginBottom: 4 }}>
                SUPRA-SCIENCE
              </div>
            )}
            {m.content}
          </div>
        ))}
        {loading && <p className="muted" style={{ margin: 0 }}>{t("thinking", lang)}</p>}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" style={{ color: "#b3261e", fontSize: 13 }}>
          {error}{" "}
          <button className="btn secondary" onClick={() => setError(null)}>
            {t("dismiss", lang)}
          </button>
        </p>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder={t("typeMessage", lang)}
          maxLength={MAX_LEN}
          disabled={loading}
          aria-label="Message"
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1px solid #c7d0da",
            background: "#ffffff",
            color: "#1E293B",
          }}
        />
        <button className="btn" onClick={send} disabled={loading || !input.trim()}>
          {loading ? "…" : t("send", lang)}
        </button>
      </div>
      <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
        {input.length}/{MAX_LEN}
      </p>
    </div>
  );
}
