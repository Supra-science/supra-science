import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "تسجيل الدخول | سوبرا-ساينس" },
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/ar/login",
    languages: { en: "/login", ar: "/ar/login" },
  },
};

export default function ArLoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
