import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({
  // Supra-Science on Cloudflare Workers (free tier).
  // Static pages are served as free assets; API routes run in the Worker.
});
