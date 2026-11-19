import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "How we work",
  description: "The Supra-Science delivery methodology: consultation, scoping, quotation, design and build, testing, handover, and support.",
  alternates: {
    canonical: "/en/process",
    languages: { en: "/en/process", ar: "/ar/process", "x-default": "/ar/process" },
  },
};

export { default } from "../../process/page";
