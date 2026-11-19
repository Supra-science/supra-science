import type { Metadata } from "next";

/**
 * English URL twin of the root page (added 2026-11-13, audit finding #2).
 * Re-exports the root English page component; only the metadata differs
 * (canonical /en/... + hreflang alternates). Language is forced to "en"
 * by getLang() via the middleware's x-pathname header.
 */
export const metadata: Metadata = {
  title: "Book a free consultation",
  description: "Book a free 30-minute consultation with Supra-Science — Sunday to Thursday, 10:00–18:00 Aden time (UTC+3), on Google Meet.",
  alternates: {
    canonical: "/en/book",
    languages: { en: "/en/book", ar: "/ar/book", "x-default": "/ar/book" },
  },
};

export { default } from "../../book/page";
