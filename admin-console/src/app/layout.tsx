import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Newsreader } from "next/font/google";

import "./globals.css";
import "./admin/admin.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
  display: "swap",
  style: ["normal", "italic"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "HINTERLAND Administration",
    template: "%s · HINTERLAND Administration",
  },
  description: "Restricted HINTERLAND administration console.",
  applicationName: "HINTERLAND Administration",
  robots: { index: false, follow: false, nocache: true },
};

const THEME_BOOT_SCRIPT = `(function(){try{var s=localStorage.getItem("hinterland-admin-theme");if(s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.dataset.theme="dark";}}catch(e){}})();`;

export default function AdminRootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
