export const dynamic = "force-static";

/**
 * GET /sitemap.xml — public sitemap for Search Console.
 * Update the routes array as public pages are added.
 *
 * Each public page is listed twice — its /ar URL and its /en URL —
 * with hreflang alternates (added 2026-11-13, audit finding #2), so
 * Google can index the English version instead of only the Arabic one.
 */
export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://suprascience.dpdns.org";
  // Final URLs only: every non-/ar, non-/en path 307-redirects to its /ar
  // twin for cookie-less visitors (including crawlers), and /ar/ 308-redirects
  // to /ar, so listing them would point crawlers at redirects. Auth pages
  // (/login, /signup, /forgot-password) are noindex and stay out.
  const routes = [
    { ar: "/ar", en: "/en", priority: "1.0", changefreq: "weekly" },
    { ar: "/ar/services", en: "/en/services", priority: "0.9", changefreq: "monthly" },
    { ar: "/ar/about", en: "/en/about", priority: "0.7", changefreq: "monthly" },
    { ar: "/ar/process", en: "/en/process", priority: "0.7", changefreq: "monthly" },
    { ar: "/ar/faq", en: "/en/faq", priority: "0.7", changefreq: "monthly" },
    { ar: "/ar/contact", en: "/en/contact", priority: "0.8", changefreq: "monthly" },
    { ar: "/ar/start", en: "/en/start", priority: "0.8", changefreq: "monthly" },
    { ar: "/ar/book", en: "/en/book", priority: "0.8", changefreq: "monthly" },
    { ar: "/ar/links", en: "/en/links", priority: "0.5", changefreq: "monthly" },
    { ar: "/ar/privacy", en: "/en/privacy", priority: "0.3", changefreq: "yearly" },
    { ar: "/ar/terms", en: "/en/terms", priority: "0.3", changefreq: "yearly" },
    { ar: "/ar/refund", en: "/en/refund", priority: "0.3", changefreq: "yearly" },
  ];
  const now = new Date().toISOString().split("T")[0];
  const urls = routes
    .map((r) => {
      const ar = `${base}${r.ar}`;
      const en = `${base}${r.en}`;
      const entry = (loc: string) => `  <url>
    <loc>${loc}</loc>
    <xhtml:link rel="alternate" hreflang="ar" href="${ar}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${en}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${ar}"/>
    <lastmod>${now}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`;
      return `${entry(ar)}\n${entry(en)}`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
