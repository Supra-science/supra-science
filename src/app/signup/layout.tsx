import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Create account | Supra-Science" },
  robots: { index: false, follow: true },
  alternates: {
    canonical: "/signup",
    languages: { en: "/signup", ar: "/ar/signup" },
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
