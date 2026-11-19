import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Supra-Science collects, uses, and protects your data when you use our website and client portal.",
  alternates: {
    canonical: "/en/privacy",
    languages: { en: "/en/privacy", ar: "/ar/privacy", "x-default": "/ar/privacy" },
  },
};

export { default } from "../../privacy/page";
