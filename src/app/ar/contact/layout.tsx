import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تواصل معنا | سوبرا-ساينس",
  description:
    "تواصل مع سوبرا-ساينس: اطلب استشارة أو عرض سعر عبر النموذج أو البريد أو واتساب. نرد بنطاق مكتوب وعرض سعر.",
  alternates: {
    canonical: "/ar/contact",
    languages: { en: "/contact", ar: "/ar/contact" },
  },
};

export default function ArContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
