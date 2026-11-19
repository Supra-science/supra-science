import type { Metadata } from "next";

/** Client portal pages are private — never indexed. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
