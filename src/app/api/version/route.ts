// src/app/api/version/route.ts — public Worker version endpoint
// (added 2026-11-19, audit finding M6).
//
// GET -> { version, tag, deployedAt }
//
// The live Worker version was not verifiable over HTTP (no version header,
// /api/version and /health all 404), so a live deployment could not be
// confirmed as the known-good version from the outside. This route exposes
// the Cloudflare version metadata binding (CF_VERSION_METADATA: the
// deployed Worker version id, tag and creation timestamp — declared in
// wrangler.jsonc; see the Cloudflare "Version metadata binding" docs).
// It exposes version strings ONLY: no secrets, no env values, no internal
// details. When the binding is absent (local dev, or a deploy from before
// the binding was added) the version reports "unknown" instead of failing.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface VersionMetadata {
  id: string;
  tag: string;
  timestamp: string;
}

/**
 * Read the version metadata binding the way src/lib/ai-engine.ts reads
 * the Workers AI binding: from the __cloudflare-context__ symbol that
 * @opennextjs/cloudflare sets at runtime. Returns null outside a Worker
 * (local dev) or when the binding is not attached.
 */
function getVersionMetadata(): VersionMetadata | null {
  try {
    const ctx = (
      globalThis as unknown as Record<
        symbol,
        { env?: { CF_VERSION_METADATA?: unknown } } | undefined
      >
    )[Symbol.for("__cloudflare-context__")];
    const meta = ctx?.env?.CF_VERSION_METADATA as VersionMetadata | undefined;
    return meta && typeof meta.id === "string" ? meta : null;
  } catch {
    return null;
  }
}

export async function GET() {
  const meta = getVersionMetadata();
  return NextResponse.json({
    version: meta?.id ?? "unknown",
    tag: meta?.tag ?? null,
    deployedAt: meta?.timestamp ?? null,
  });
}
