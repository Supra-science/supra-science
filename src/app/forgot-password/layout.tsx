import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Reset password | Supra-Science" },
  robots: { index: false, follow: true },
};

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
