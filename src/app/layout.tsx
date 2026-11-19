import type { Metadata } from "next";
import { headers } from "next/headers";
import { getLang } from "@/lib/lang-server";
import "./globals.css";
import { staticServices } from "@/lib/services";

const siteUrl = "https://suprascience.dpdns.org";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Supra-Science | AI, Software, IoT & Engineering Solutions",
    template: "%s | Supra-Science",
  },
  description:
    "Supra-Science — software engineering, AI solutions, IoT and connected devices, medical technology, and digital transformation. Serving the US, Saudi Arabia, UAE, Qatar, Kuwait, Bahrain, and Oman. Available in English and Arabic.",
  authors: [{ name: "Supra-Science" }],
  openGraph: {
    type: "website",
    siteName: "Supra-Science",
    locale: "en_US",
    url: siteUrl,
    title: "Supra-Science | AI, Software, IoT & Engineering Solutions",
    description:
      "Software engineering, AI solutions, IoT, medical technology, and digital transformation.",
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
    title: "Supra-Science | AI, Software, IoT & Engineering Solutions",
    description:
      "Software engineering, AI solutions, IoT, medical technology, and digital transformation.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Supra-Science",
  url: siteUrl,
  logo: `${siteUrl}/og-image.png`,
  sameAs: [
    "https://www.facebook.com/Suprascience",
    "https://www.linkedin.com/company/supra-science/",
    "https://x.com/supra_science",
    "https://www.youtube.com/@supra.science",
    "https://t.me/suprascience1",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+1-917-818-3426",
    email: "Supra-science@proton.me",
    contactType: "sales",
    availableLanguage: ["English", "Arabic"],
  },
};

/** Schema.org service list with indicative starting prices. */
function servicesJsonLd() {
  const en = staticServices("en");
  const arById = new Map(staticServices("ar").map((s) => [s.id, s.title]));
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: en.map((service, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: service.title,
        alternateName: arById.get(service.id) ?? undefined,
        url: `${siteUrl}/services#${service.id}`,
        provider: { "@type": "Organization", name: "Supra-Science", url: siteUrl },
        offers: {
          "@type": "Offer",
          price: String(service.startingPriceUsd),
          priceCurrency: "USD",
          description:
            "Indicative starting price — the final price is set in the written quotation after scope review.",
        },
      },
    })),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // getLang() honours the /en and /ar URL prefixes (via the middleware's
  // x-pathname header) before falling back to the ss-lang cookie.
  const lang = await getLang();
  // CSP nonce (added 2026-11-13, audit finding #9): the middleware sets
  // x-nonce per request; the JSON-LD data scripts need it explicitly
  // (Next.js only adds it automatically to its own runtime scripts).
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  return (
    <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"}>
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@400;500;600;700;800&family=Cairo:wght@600;700;800&family=Noto+Sans+Arabic:wght@400;500;600;700&family=Montserrat:wght@700;800&family=Tajawal:wght@400;500;700;800&family=Inter:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500;600;700&display=swap"
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
        />
        <script
          type="application/ld+json"
          nonce={nonce}
          dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd()) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
