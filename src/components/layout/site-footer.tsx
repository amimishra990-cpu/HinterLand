import Link from "next/link";

import { BrandMark } from "@/components/layout/brand-mark";
import { siteConfig } from "@/config/site";

const exploreLinks = [
  { label: "Product preview", href: "/#product" },
  { label: "3D experience", href: "/#experience" },
  { label: "Open workspace", href: "/app" },
  { label: "Technology & trust", href: "/#trust" },
  { label: "Roadmap", href: "/#roadmap" },
];

const principleLinks = [
  { label: "Our principles", href: "/#principles" },
  { label: "Review before saving", href: "/#product" },
  { label: "Evidence and uncertainty", href: "/#trust" },
  { label: "Consent-based recording", href: "/#trust" },
];

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-gold/20 bg-deep text-ivory">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-28 right-0 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(201,164,92,0.1),transparent_70%)] blur-2xl" />
        <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(114,47,69,0.18),transparent_72%)] blur-3xl" />
      </div>

      <div className="relative mx-auto w-full max-w-[1120px] px-6 py-16 lg:py-20">
        <div
          data-reveal-stagger
          className="grid gap-12 md:grid-cols-[1.5fr_1fr_1fr]"
        >
          <div>
            <BrandMark tone="light" />
            <p className="mt-6 max-w-xs font-heading text-[26px] leading-tight text-ivory/90">
              The work behind the work.
            </p>
            <p className="mt-4 max-w-sm text-sm leading-6 text-ivory/60">
              A context-aware professional workspace. The interactive demo uses
              sample project data and stores no account information.
            </p>
          </div>

          <nav aria-label="Navigate" className="flex flex-col gap-3">
            <p className="eyebrow text-gold">Navigate</p>
            {siteConfig.nav.map((item) => (
              <a
                key={item.href}
                href={`/${item.href}`}
                className="w-fit text-sm text-ivory/70 transition-colors hover:text-ivory focus-visible:outline-gold"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <nav aria-label="Explore" className="flex flex-col gap-3">
            <p className="eyebrow text-gold">Explore</p>
            {exploreLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="w-fit text-sm text-ivory/70 transition-colors hover:text-ivory focus-visible:outline-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div data-reveal className="mt-14 border-t border-ivory/15 pt-6">
          <div className="flex flex-col gap-3 text-[11.5px] leading-5 text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 Hinterland. All rights reserved.</p>
            <p>
              Sample content is used on this site. Your workspace and documents are private to
              your account.
            </p>
          </div>

          <nav
            aria-label="Principles"
            className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[11.5px] text-ivory/55"
          >
            {principleLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="transition-colors hover:text-ivory focus-visible:outline-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
