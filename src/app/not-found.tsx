import type { Metadata } from "next";
import { headers } from "next/headers";
import NotFoundContent from "@/components/not-found-content";

export async function generateMetadata(): Promise<Metadata> {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isAr = pathname.startsWith("/ar");
  return {
    title: isAr
      ? { absolute: "الصفحة غير موجودة | سوبرا-ساينس" }
      : { absolute: "Page not found | Supra-Science" },
    description: isAr
      ? "هذه الصفحة غير موجودة أو تم نقلها."
      : "This page does not exist or was moved.",
    robots: { index: false, follow: true },
  };
}

/**
 * Root 404 page. Reads the `x-pathname` header (set by middleware) so
 * the shared client content renders in Arabic for /ar… URLs even before
 * hydration; the client component re-detects the language from the
 * pathname itself.
 * (Reconstructed from the Nov-8 live bundle, module 3363.)
 */
export default async function NotFound() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  return <NotFoundContent initialIsAr={pathname.startsWith("/ar")} />;
}
