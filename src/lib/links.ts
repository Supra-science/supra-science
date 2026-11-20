/**
 * Links page data — the single source of truth for the /links page
 * (the bio link on Instagram and every other "all our links" surface).
 * All URLs verified against the live site / social accounts 2026-11-20.
 * Keep this list in sync with the footer (site-chrome.tsx) and the
 * JSON-LD sameAs list (layout.tsx).
 */
export type SiteLink = {
  id: string;
  href: string;
  labelEn: string;
  labelAr: string;
  handle?: string;
  primary?: boolean;
};

export const SITE_LINKS: SiteLink[] = [
  {
    id: "whatsapp",
    href: "https://wa.me/19178183426",
    labelEn: "WhatsApp — chat with us",
    labelAr: "واتساب — راسلنا مباشرة",
    handle: "+1 (917) 818-3426",
    primary: true,
  },
  {
    id: "website",
    href: "https://suprascience.dpdns.org",
    labelEn: "Official website",
    labelAr: "الموقع الرسمي",
    handle: "suprascience.dpdns.org",
  },
  {
    id: "services",
    href: "https://suprascience.dpdns.org/ar/services",
    labelEn: "Services & starting prices",
    labelAr: "خدماتنا وأسعار البداية",
    handle: "SupraStat from $49 · SupraPub from $59",
  },
  {
    id: "facebook",
    href: "https://www.facebook.com/Suprascience",
    labelEn: "Facebook",
    labelAr: "فيسبوك",
    handle: "Suprascience",
  },
  {
    id: "instagram",
    href: "https://www.instagram.com/supra.science2",
    labelEn: "Instagram",
    labelAr: "إنستغرام",
    handle: "@supra.science2",
  },
  {
    id: "linkedin",
    href: "https://www.linkedin.com/company/supra-science/",
    labelEn: "LinkedIn",
    labelAr: "لينكدإن",
    handle: "Supra-Science",
  },
  {
    id: "x",
    href: "https://x.com/supra_science",
    labelEn: "X",
    labelAr: "إكس",
    handle: "@supra_science",
  },
  {
    id: "youtube",
    href: "https://www.youtube.com/@supra.science",
    labelEn: "YouTube",
    labelAr: "يوتيوب",
    handle: "@supra.science",
  },
  {
    id: "telegram",
    href: "https://t.me/suprascience1",
    labelEn: "Telegram",
    labelAr: "تيليجرام",
    handle: "@suprascience1",
  },
  {
    id: "email",
    href: "mailto:Supra-science@proton.me",
    labelEn: "Email",
    labelAr: "البريد الإلكتروني",
    handle: "Supra-science@proton.me",
  },
];
