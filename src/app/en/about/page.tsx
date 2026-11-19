import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "About",
  description: "Supra-Science is an engineering practice led by experience, building software, AI systems, embedded devices, and scientific prototypes — and delivering them as working systems. Learn how we work and how to reach us.",
  alternates: {
    canonical: "/en/about",
    languages: { en: "/en/about", ar: "/ar/about", "x-default": "/ar/about" },
  },
};

export { default } from "../../about/page";
