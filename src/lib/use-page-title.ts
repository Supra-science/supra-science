/**
 * Set the browser tab title from a client component.
 *
 * Recovered from the live Nov-8 deployment bundle
 * (embedded `src/lib/use-page-title.ts` module).
 */

"use client";

import { useEffect } from "react";

export function usePageTitle(title: string): void {
  useEffect(() => {
    document.title = title;
  }, [title]);
}
