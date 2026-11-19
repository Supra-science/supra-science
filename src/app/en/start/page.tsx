import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Start your project",
  description: "Guided project intake: describe your idea, get a structured summary, and send it via WhatsApp or the contact form.",
  alternates: {
    canonical: "/en/start",
    languages: { en: "/en/start", ar: "/ar/start", "x-default": "/ar/start" },
  },
};

export { default } from "../../start/page";
