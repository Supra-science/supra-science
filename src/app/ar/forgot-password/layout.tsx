import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "استعادة كلمة المرور | سوبرا-ساينس" },
  robots: { index: false, follow: true },
};

export default function ArForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
