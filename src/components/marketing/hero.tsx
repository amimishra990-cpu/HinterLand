import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WordRevealText } from "@/components/shared/word-reveal";
import { cn } from "@/lib/utils";

const boardItems = [
  {
    tag: "Stated intention",
    meta: "Message · draft",
    text: "“Ask for a decision on the timeline without sounding defensive.”",
    dot: "bg-terracotta",
  },
  {
    tag: "Project objective",
    meta: "Harbour · objective",
    text: "Confirm the phase-two scope before the pilot review.",
    dot: "bg-gold",
  },
  {
    tag: "Prior decision",
    meta: "[1] Meeting notes · 12 Oct",
    text: "Phase two begins only after the pilot review is complete.",
    dot: "bg-sage",
  },
  {
    tag: "Meeting brief",
    meta: "Preparation · 6 items",
    text: "Three questions for Thursday, each tied to a source.",
    dot: "bg-terracotta",
  },
  {
    tag: "Message draft",
    meta: "Refinement · draft",
    text: "A shorter ask, with the timeline rationale kept intact.",
    dot: "bg-gold",
  },
];

const assurances = [
  "Private by default",
  "No model calls",
  "Review before use",
];

export function Hero() {
  return (
    <section id="overview" className="hero-shell relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden md:block"
      >
        <div className="hero-orbit hero-orbit-a" />
        <div className="hero-orbit hero-orbit-b" />
        <div className="hero-orbit hero-orbit-c" />
        <span className="hero-spark hero-spark-a" />
        <span className="hero-spark hero-spark-b" />
        <span className="hero-spark hero-spark-c" />
      </div>

      <div className="relative mx-auto grid w-full max-w-[1280px] gap-14 px-5 pt-14 pb-12 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:gap-10 lg:px-8 lg:pt-24 lg:pb-16">
        <div className="flex flex-col justify-center">
          <div data-reveal className="flex items-center gap-3">
            <span
              aria-hidden="true"
              data-draw
              className="h-px w-10 bg-terracotta"
            />
            <p className="eyebrow">HINTERLAND · Context, connected</p>
          </div>

          <h1
            data-word-reveal
            data-words-ready="true"
            className="mt-7 max-w-[12ch] text-balance font-heading text-[clamp(3rem,6.3vw,4.9rem)] leading-[0.98] tracking-[-0.03em] text-ink"
          >
            <WordRevealText>
              {"The work "}
              <em className="drift-word text-gold italic">behind</em>
              {" the work."}
            </WordRevealText>
          </h1>

          <p
            data-reveal
            data-reveal-delay="0.08"
            className="mt-7 max-w-lg text-pretty text-[18px] leading-8 text-ink/70"
          >
            Your messages, meetings, documents and decisions are connected.
            Your workflow should be too.
          </p>

          <div
            data-reveal
            data-reveal-delay="0.14"
            className="mt-9 flex flex-col gap-3 sm:flex-row"
          >
            <Button asChild size="lg">
              <a href="#features">
                Explore Hinterland
                <ArrowRight aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">
                Sign in to your workspace
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
          </div>

          <ul
            data-reveal-stagger
            className="mt-10 flex flex-wrap gap-x-5 gap-y-2.5 text-[12px] text-ink/70"
          >
            {assurances.map((item) => (
              <li key={item} className="flex items-center gap-1.5">
                <Check
                  aria-hidden="true"
                  strokeWidth={1.75}
                  className="size-3.5 text-forest"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          data-parallax="3"
          className="relative flex items-center justify-center lg:justify-end"
        >
          <div
            aria-hidden="true"
            className="absolute inset-x-4 top-6 bottom-2 hidden border border-gold/15 bg-stone/30 sm:block"
          />
          <div
            data-reveal
            data-reveal-delay="0.16"
            className="preview-card relative w-full max-w-[520px] border border-ink/15 bg-paper shadow-1"
          >
            <div className="flex items-center justify-between gap-4 border-b border-ink/10 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="size-1.5 bg-forest" />
                <p className="text-[10.5px] font-semibold tracking-[0.14em] text-ink/70 uppercase">
                  Project context
                </p>
              </div>
              <Badge variant="outline">Sample data</Badge>
            </div>

            <div className="px-5 pt-4 pb-5">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-heading text-[19px] leading-tight text-ink">
                  Harbour proposal
                </p>
                <p className="text-[10px] tracking-[0.1em] text-ink/70 uppercase">
                  In progress
                </p>
              </div>

              <div className="relative mt-5">
                <span
                  aria-hidden="true"
                  className="absolute top-2 bottom-2 left-[3px] w-px bg-ink/12"
                />
                <ol className="space-y-3">
                  {boardItems.map((item, index) => (
                    <li key={item.tag} className="relative pl-6">
                      <span
                        aria-hidden="true"
                        className={cn(
                          "thread-dot absolute top-[18px] left-0 size-[7px] rounded-full ring-2 ring-paper",
                          item.dot
                        )}
                        style={{ animationDelay: `${index * -0.7}s` }}
                      />
                      <div className="border border-ink/10 bg-background/95 px-3.5 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[9.5px] font-semibold tracking-[0.13em] text-ink/70 uppercase">
                            {item.tag}
                          </p>
                          <p className="shrink-0 text-[9.5px] text-ink/70">
                            {item.meta}
                          </p>
                        </div>
                        <p className="mt-1.5 font-heading text-[15px] leading-snug text-ink/90">
                          {item.text}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-ink/10 bg-stone/35 px-5 py-3">
              <p className="font-heading text-[12.5px] text-ink/70 italic">
                Context stays with the project.
              </p>
              <p className="text-[10px] tracking-[0.08em] text-ink/70">
                5 items · 3 sources
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        data-reveal
        className="relative mx-auto flex w-full max-w-[1280px] items-center justify-between px-5 pb-8 sm:px-6 lg:px-8"
      >
        <a
          href="#problem"
          className="group flex items-center gap-3 text-[10.5px] font-semibold tracking-[0.16em] text-ink/70 uppercase transition-colors hover:text-ink"
        >
          <span className="grid size-8 place-items-center border border-ink/15 transition-transform duration-200 group-hover:translate-y-0.5">
            <ArrowDown aria-hidden="true" strokeWidth={1.5} className="size-3.5" />
          </span>
          The problem
        </a>
        <p className="hidden text-[10.5px] tracking-[0.14em] text-ink/70 uppercase sm:block">
          A professional context workspace
        </p>
      </div>
    </section>
  );
}
