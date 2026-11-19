import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact | Supra-Science",
  description:
    "Contact Supra-Science: request a consultation or a quote by form, email, or WhatsApp. We respond with a written scope and quotation.",
  alternates: {
    canonical: "/contact",
    languages: { en: "/contact", ar: "/ar/contact" },
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
