import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { WordRevealText } from "@/components/shared/word-reveal";

export function ClosingSection() {
  return (
    <section className="section-shell tone-gold relative overflow-hidden border-t border-ink/10 bg-stone/30">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="hero-orbit hero-orbit-a opacity-70" />
        <div className="hero-orbit hero-orbit-b opacity-70" />
        <div className="absolute -top-32 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(201,164,92,0.1),transparent_68%)] blur-2xl" />
        <span className="hero-spark hero-spark-a" />
        <span className="hero-spark hero-spark-c" />
      </div>

      <div className="relative mx-auto w-full max-w-[1120px] px-6 py-24 lg:py-32">
        <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
          <div>
            <div data-reveal className="flex items-center gap-3">
              <span
                aria-hidden="true"
                data-draw
                className="h-px w-8 bg-terracotta"
              />
              <p className="eyebrow">Begin with context</p>
            </div>
            <h2
              data-word-reveal
              data-words-ready="true"
              className="mt-6 max-w-2xl text-balance font-heading text-[clamp(2.6rem,6vw,4.3rem)] leading-[1.02] tracking-[-0.025em] text-ink"
            >
              <WordRevealText>
                Make every conversation{" "}
                <em className="drift-word text-gold italic">count</em>.
              </WordRevealText>
            </h2>
            <p
              data-reveal
              data-reveal-delay="0.08"
              className="mt-6 max-w-lg text-pretty text-[18px] leading-8 text-ink/70"
            >
              Keep your ideas clear, your projects connected, and your knowledge
              within reach.
            </p>
          </div>

          <div data-reveal data-reveal-delay="0.16" className="lg:pb-1">
            <Button asChild size="lg">
              <Link href="/register">
                Create your workspace
                <ArrowUpRight aria-hidden="true" />
              </Link>
            </Button>
            <p className="mt-3 text-[10.5px] text-ink/70">
              Email verification · Private by default
            </p>
          </div>
        </div>

        <div
          data-reveal
          className="mt-16 flex flex-col justify-between gap-4 border-t border-ink/15 pt-6 sm:flex-row sm:items-center"
        >
          <p className="flex items-center gap-2 text-[11px] text-ink/70">
            <Check
              aria-hidden="true"
              strokeWidth={1.75}
              className="size-3.5 text-forest"
            />
            Review before saving. Private by default.
          </p>
          <p className="font-heading text-[14px] text-ink/70 italic">
            The work behind the work.
          </p>
        </div>
      </div>
    </section>
  );
}
