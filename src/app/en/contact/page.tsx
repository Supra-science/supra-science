import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Contact",
  description: "Talk to Supra-Science about your project — email, WhatsApp, or Google Meet. We reply in English and Arabic.",
  alternates: {
    canonical: "/en/contact",
    languages: { en: "/en/contact", ar: "/ar/contact", "x-default": "/ar/contact" },
  },
};

export { default } from "../../contact/page";
