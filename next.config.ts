import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      // HSTS (added 2026-11-13, audit finding #8): 1 year, subdomains.
      // No preload: this is a workers.dev subdomain, preload applies to
      // the registrable domain, not to it.
      { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
      // NOTE: Content-Security-Policy is NOT set here anymore — it moved
      // to middleware.ts (finding #9) because the nonce must be fresh
      // on every request. Setting it in both places would enforce both.
    ] }];
  }
};
export default nextConfig;