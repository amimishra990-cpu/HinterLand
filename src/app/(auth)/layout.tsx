import type { Metadata } from "next";
import Link from "next/link";

import "@/app/app-theme.css";

export const metadata: Metadata = {
  title: {
    default: "Account",
    template: "%s · Hinterland",
  },
  robots: { index: false, follow: false },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-theme flex min-h-dvh flex-col">
      <header
        className="border-b"
        style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel)" }}
      >
        <div className="mx-auto flex h-14 w-full max-w-[1120px] items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label="Hinterland home">
            <span
              className="flex h-8 w-8 items-center justify-center border font-heading text-[15px]"
              style={{
                borderColor: "var(--app-forest)",
                color: "var(--app-forest)",
                borderRadius: 3,
              }}
              aria-hidden="true"
            >
              H
            </span>
            <span className="font-heading text-[14px] tracking-[0.14em]">HINTERLAND</span>
          </Link>
          <Link
            href="/"
            className="text-[12px] font-medium"
            style={{ color: "var(--app-forest)" }}
          >
            Back to site
          </Link>
        </div>
      </header>
      <main id="main" className="flex flex-1 items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-[460px]">{children}</div>
      </main>
      <footer className="px-4 pb-6 text-center text-[11px]" style={{ color: "var(--app-muted)" }}>
        Your workspace data is private to your account.
      </footer>
    </div>
  );
}
