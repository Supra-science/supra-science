import type { Metadata } from "next";
import LinksPage from "@/components/links-page";

export const metadata: Metadata = {
  title: "Supra-Science — كل الروابط",
  description:
    "كل روابط Supra-Science في مكان واحد: الموقع، واتساب، الخدمات وكل حسابات التواصل الاجتماعي.",
  alternates: {
    canonical: "/ar/links",
    languages: { en: "/en/links", ar: "/ar/links", "x-default": "/ar/links" },
  },
};

export default function LinksPageAr() {
  return <LinksPage lang="ar" />;
}
