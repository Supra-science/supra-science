import Link from "next/link";
import type { Lang } from "@/lib/i18n";

/**
 * Shared navy nav for the client workspace (dashboard) pages.
 *
 * Brand + language toggle + a right-side action. The toggle goes through
 * /api/lang (sets the ss-lang cookie) and returns to `next` so the user
 * stays on the same page. The toggle uses a light color: on the navy nav
 * the dark `.btn.secondary` style would be invisible.
 */
export default function DashboardNav({
  lang,
  next,
  right,
}: {
  lang: Lang;
  next: string;
  right?: React.ReactNode;
}) {
  const otherLang = lang === "ar" ? "en" : "ar";
  return (
    <nav className="nav">
      <Link href="/" className="brand">
        <span className="brandmark">S</span>SUPRA<span className="brand-sep">/</span>
        <span className="gold">SCIENCE</span>
      </Link>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <a
          href={`/api/lang?to=${otherLang}&next=${next}`}
          style={{ color: "#c7d6e8", fontSize: 13, textDecoration: "none" }}
        >
          {otherLang === "ar" ? "العربية" : "English"}
        </a>
        {right}
      </div>
    </nav>
  );
}
