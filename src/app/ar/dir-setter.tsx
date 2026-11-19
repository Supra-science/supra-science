"use client";
import { useEffect } from "react";

/**
 * Sets <html lang="ar" dir="rtl"> while an /ar route is mounted.
 * (Nested App Router layouts cannot render <html> themselves,
 * so this client component applies the attributes on mount.)
 */
export default function ArDirSetter() {
  useEffect(() => {
    const html = document.documentElement;
    const prevLang = html.getAttribute("lang");
    const prevDir = html.getAttribute("dir");
    html.setAttribute("lang", "ar");
    html.setAttribute("dir", "rtl");
    return () => {
      if (prevLang) html.setAttribute("lang", prevLang);
      else html.removeAttribute("lang");
      if (prevDir) html.setAttribute("dir", prevDir);
      else html.removeAttribute("dir");
    };
  }, []);
  return null;
}
