import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "FAQ",
  description: "Frequently asked questions about working with Supra-Science: scoping, quotations, timelines, AI and hardware projects, communication, and support.",
  alternates: {
    canonical: "/en/faq",
    languages: { en: "/en/faq", ar: "/ar/faq", "x-default": "/ar/faq" },
  },
};

export { default } from "../../faq/page";
