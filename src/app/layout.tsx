import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Newsreader } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionBridge } from "@/components/app/session-bridge";
import "./globals.css";

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
    default: "Hinterland — The work behind the work.",
    template: "%s · Hinterland",
  },
  description:
    "Hinterland connects your messages, meetings, documents and decisions, so the context behind your work stays with you.",
  applicationName: "Hinterland",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn(newsreader.variable, dmSans.variable)}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-transparent font-sans text-foreground antialiased">
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <TooltipProvider delayDuration={250}>
          <SessionBridge />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
