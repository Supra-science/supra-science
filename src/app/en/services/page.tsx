import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Services",
  description: "Supra-Science services: digital products and applications, software and AI, embedded systems and IoT, scientific and medical prototypes, business automation and WhatsApp integration. Request a quote.",
  alternates: {
    canonical: "/en/services",
    languages: { en: "/en/services", ar: "/ar/services", "x-default": "/ar/services" },
  },
};

export { default } from "../../services/page";
