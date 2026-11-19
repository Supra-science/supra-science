import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "The terms governing use of the Supra-Science website, client portal, quotations, and project engagements.",
  alternates: {
    canonical: "/en/terms",
    languages: { en: "/en/terms", ar: "/ar/terms", "x-default": "/ar/terms" },
  },
};

export { default } from "../../terms/page";
