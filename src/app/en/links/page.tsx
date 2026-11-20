import type { Metadata } from "next";

/**
 * English URL twin of the links page (audit finding #2 pattern).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/links + hreflang alternates).
 */
export const metadata: Metadata = {
  title: "Supra-Science — All links",
  description:
    "Every Supra-Science link in one place: website, WhatsApp, services and all social media accounts.",
  alternates: {
    canonical: "/en/links",
    languages: { en: "/en/links", ar: "/ar/links", "x-default": "/ar/links" },
  },
};

export { default } from "../../links/page";
