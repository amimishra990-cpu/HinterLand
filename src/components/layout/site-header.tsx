"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu } from "lucide-react";

import { BrandMark } from "@/components/layout/brand-mark";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

const sectionToNav: Record<string, string> = {
  overview: "#overview",
  problem: "#overview",
  solution: "#overview",
  features: "#features",
  product: "#features",
  workflow: "#workflow",
  experience: "#workflow",
  "use-cases": "#use-cases",
  principles: "#principles",
  trust: "#principles",
  roadmap: "#roadmap",
};

const sectionIds = Object.keys(sectionToNav);

export function SiteHeader() {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("#overview");
  const [open, setOpen] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);

      const bar = progressRef.current;
      if (!bar) return;

      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
      bar.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    const sections = sectionIds
      .map((id) => document.getElementById(id))
      .filter((element): element is HTMLElement => element !== null);

    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]) {
          setActive(sectionToNav[visible[0].target.id]);
        }
      },
      { rootMargin: "-32% 0px -56% 0px", threshold: [0, 0.1, 0.5, 1] }
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-gold/20 bg-background shadow-1"
          : "border-transparent bg-background"
      )}
    >
      <div className="mx-auto flex h-[var(--header-height)] w-full max-w-[1280px] items-center justify-between gap-6 px-5 sm:px-6 lg:px-8">
        <BrandMark />

        <nav aria-label="Primary" className="hidden items-center gap-6 lg:flex">
          {siteConfig.nav.map((item) => {
            const href = onHome ? item.href : `/${item.href}`;
            const isActive = onHome && active === item.href;

            return (
              <a
                key={item.href}
                href={href}
                aria-current={isActive ? "location" : undefined}
                onClick={() => setActive(item.href)}
                className={cn(
                  "relative py-2 text-[12.5px] font-medium tracking-[0.01em] whitespace-nowrap transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-gold after:transition-transform after:duration-300 hover:text-ink",
                  isActive ? "text-forest after:scale-x-100" : "text-ink/70"
                )}
              >
                {item.label}
              </a>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/app">
              Open Workspace
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-ink lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="flex flex-col">
              <SheetHeader className="border-b border-ink/10">
                <BrandMark />
                <SheetTitle className="sr-only">Site navigation</SheetTitle>
                <SheetDescription>
                  Explore the product, the method, and what is planned next.
                </SheetDescription>
              </SheetHeader>

              <nav
                aria-label="Mobile"
                className="flex flex-1 flex-col px-6 py-4"
              >
                {siteConfig.nav.map((item, index) => {
                  const href = onHome ? item.href : `/${item.href}`;
                  const isActive = onHome && active === item.href;

                  return (
                    <SheetClose asChild key={item.href}>
                      <a
                        href={href}
                        aria-current={isActive ? "location" : undefined}
                        onClick={() => setActive(item.href)}
                        className={cn(
                          "flex items-baseline gap-4 border-b border-ink/10 py-4 transition-colors hover:bg-gold/[0.05]",
                          isActive ? "text-forest" : "text-ink hover:text-forest"
                        )}
                      >
                        <span className="tnum text-[10px] font-semibold tracking-[0.14em] text-accent-ink">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="font-heading text-2xl leading-none">
                          {item.label}
                        </span>
                      </a>
                    </SheetClose>
                  );
                })}
              </nav>

              <div className="border-t border-ink/10 p-6">
                <SheetClose asChild>
                  <Link
                    href="/app"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "w-full justify-between"
                    )}
                  >
                    Enter workspace
                    <ArrowUpRight aria-hidden="true" />
                  </Link>
                </SheetClose>
                <p className="mt-3 text-center text-[11px] leading-4 text-ink/70">
                  Preview access. No account required.
                </p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <span
        ref={progressRef}
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-gradient-to-r from-gold/70 via-gold to-terracotta"
      />
    </header>
  );
}
