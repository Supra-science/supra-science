import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "إنشاء حساب | سوبرا-ساينس" },
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/ar/signup",
    languages: { en: "/signup", ar: "/ar/signup" },
  },
};

export default function ArSignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
