import type { Metadata } from "next";
import LinksPage from "@/components/links-page";

export const metadata: Metadata = {
  title: "Supra-Science — All links",
  description:
    "Every Supra-Science link in one place: website, WhatsApp, services and all social media accounts.",
  alternates: {
    canonical: "/links",
    languages: { en: "/en/links", ar: "/ar/links", "x-default": "/ar/links" },
  },
};

export default function LinksPageEn() {
  return <LinksPage lang="en" />;
}
