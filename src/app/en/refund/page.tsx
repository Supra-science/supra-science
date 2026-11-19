import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-14, decision 2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Refund & Cancellation Policy",
  description: "Clear milestone-based refund, cancellation, and revision terms for Supra-Science engineering and scientific services.",
  alternates: {
    canonical: "/en/refund",
    languages: { en: "/en/refund", ar: "/ar/refund", "x-default": "/ar/refund" },
  },
};

export { default } from "../../refund/page";
