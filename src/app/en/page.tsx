import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Supra-Science | Engineering, Software, AI & Connected Systems",
  description: "Supra-Science designs and builds software, AI systems, connected devices, and scientific technology — from requirements to a delivered, working system, led by one team that owns it end to end. Request a consultation.",
  alternates: {
    canonical: "/en",
    languages: { en: "/en", ar: "/ar", "x-default": "/ar" },
  },
};

export { default } from "../page";
