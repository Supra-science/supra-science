# OpenAI (AI Assistant) — Setup Guide

Supra-Science — the public AI assistant chain is Workers AI → Gemini →
OpenAI → rule-based fallback. OpenAI is the **fallback** layer: the assistant
already works through Gemini today, so this key is optional.

> **Cost warning:** OpenAI is pay-as-you-go (usage-based billing). Do not
> create a key or add funds unless you already have an OpenAI account with
> credit. The $0 budget rule applies: no purchase, no subscription.
>
> **Never paste the key in chat, email, or code.** It goes into Cloudflare
> as a Worker secret only.

## The secret

| Secret | Where it comes from |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com → API keys → Create new secret key (copy it immediately — shown once). |

## Steps

1. Create the key at platform.openai.com (only if you already have an account
   with credit).
2. Cloudflare: Workers & Pages → `supra-science` → Settings → Variables →
   Add variable → name `OPENAI_API_KEY`, value = the key → Save → **Deploy**.
3. Open the admin Integrations page — OpenAI should show **Connected (3/3)**.
4. Test the public assistant on the site once.

## Notes

- The key is server-side only (`process.env.OPENAI_API_KEY`). It must never
  appear in client code and never be a `NEXT_PUBLIC_` variable.
- If the key is missing, the assistant still works (Gemini + rule-based
  fallback); the Integrations page simply shows OpenAI as Pending.
