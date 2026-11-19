import type { Metadata } from "next";
import "../globals.css";
import ArDirSetter from "./dir-setter";

export const metadata: Metadata = {
  title: {
    default: "سوبرا-ساينس | حلول الذكاء الاصطناعي والبرمجيات وإنترنت الأشياء",
    template: "%s | سوبرا-ساينس",
  },
  description:
    "سوبرا-ساينس — هندسة البرمجيات، حلول الذكاء الاصطناعي، إنترنت الأشياء والأجهزة المتصلة، التقنيات الطبية، والتحول الرقمي. نخدم الولايات المتحدة والمملكة العربية السعودية والإمارات العربية المتحدة وقطر والكويت والبحرين وسلطنة عُمان. متوفر بالعربية والإنجليزية.",
  openGraph: {
    type: "website",
    siteName: "Supra-Science",
    locale: "ar_AR",
    url: "https://suprascience.dpdns.org/ar",
    title: "سوبرا-ساينس | حلول الذكاء الاصطناعي والبرمجيات وإنترنت الأشياء",
    description:
      "هندسة البرمجيات، حلول الذكاء الاصطناعي، إنترنت الأشياء، التقنيات الطبية، والتحول الرقمي.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Supra-Science — Engineering, AI & Connected Systems",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "سوبرا-ساينس | حلول الذكاء الاصطناعي والبرمجيات وإنترنت الأشياء",
    description:
      "هندسة البرمجيات، حلول الذكاء الاصطناعي، إنترنت الأشياء، التقنيات الطبية، والتحول الرقمي.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ArLayout({ children }: { children: React.ReactNode }) {
  return (
    <div dir="rtl" lang="ar">
      <ArDirSetter />
      {children}
    </div>
  );
}
