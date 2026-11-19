export const dynamic = "force-static";

/** GET /robots.txt — allow all crawlers on public pages; admin/API excluded. */
export async function GET() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://suprascience.dpdns.org";
  const txt = `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /dashboard/

Sitemap: ${base}/sitemap.xml
`;
  return new Response(txt, {
    headers: { "Content-Type": "text/plain" },
  });
}
