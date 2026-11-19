import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Sign in | Supra-Science" },
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/login",
    languages: { en: "/login", ar: "/ar/login" },
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
