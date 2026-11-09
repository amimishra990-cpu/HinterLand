import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import {
  Compass,
  Library,
  Link2,
  PenLine,
  TrendingUp,
  Workflow,
} from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";

const principles: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
}> = [
  {
    icon: Link2,
    title: "Context continuity",
    description:
      "Every task shows which project and sources it uses. Approved context stays available for later work without silently crossing project boundaries.",
  },
  {
    icon: PenLine,
    title: "Intent preservation",
    description:
      "Refinement improves clarity, structure, tone, and persuasion without changing what you meant. The original text and intention never disappear.",
  },
  {
    icon: Compass,
    title: "Proactive assistance",
    description:
      "Gaps, risks, and missing questions are surfaced as findings you can review, not buried inside polished prose that sounds more certain than the source.",
  },
  {
    icon: TrendingUp,
    title: "Personalized improvement",
    description:
      "Suggestions explain themselves, remain editable, and can be reset. Your voice is the standard; the system is only a careful reader.",
  },
  {
    icon: Workflow,
    title: "Connected workflow",
    description:
      "Preparation, refinement, documentation, and knowledge share one visual grammar and one context thread rather than five disconnected tools.",
  },
  {
    icon: Library,
    title: "Knowledge retention",
    description:
      "Approved decisions, action items, and open questions become durable, dated, searchable records instead of disappearing into a meeting.",
  },
];

export function PrinciplesSection() {
  return (
    <section
      id="principles"
      className="section-shell tone-burgundy border-t border-ink/10 bg-stone/20"
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
          <div className="lg:sticky lg:top-32 lg:self-start">
            <SectionHeading
              eyebrow="Our principles"
              title="Principles in practice, not features on a list."
              lead="The product is judged by whether it helps you think and act clearly, not by how much it generates."
            />

            <div data-reveal className="mt-10 border-y border-ink/15 py-7">
              <p className="font-heading text-[30px] leading-tight text-ink italic">
                “Hinterland proposes.
                <br />
                You{" "}
                <em className="drift-word text-gold not-italic">decide</em>.”
              </p>
              <p className="mt-3 text-[12px] leading-5 text-ink/70">
                Assistance, not authorship. The user remains responsible for
                every saved or shared outcome.
              </p>
            </div>

            <p data-reveal className="mt-6 text-[11px] leading-5 text-ink/70">
              Personalized improvement is planned after the MVP. The principle
              above governs how it will be designed.
            </p>
          </div>

          <div data-reveal-stagger>
            {principles.map((principle, index) => {
              const Icon = principle.icon;

              return (
                <div
                  key={principle.title}
                  className="grid grid-cols-[2.25rem_1fr] gap-4 border-b border-ink/10 py-6 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[2.75rem_1fr] sm:gap-5"
                >
                  <span className="tnum pt-0.5 font-heading text-2xl text-accent-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <Icon
                        aria-hidden="true"
                        strokeWidth={1.5}
                        className="size-4 text-forest"
                      />
                      <h3 className="font-heading text-[21px] leading-snug text-ink">
                        {principle.title}
                      </h3>
                    </div>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-ink/70">
                      {principle.description}
                    </p>
                  </div>
                </div>
              );
            })}

            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink/15 pt-5 text-[10.5px] font-semibold tracking-[0.08em] text-ink/70 uppercase">
              <span>Evidence over inference</span>
              <span aria-hidden="true" className="h-3 w-px bg-ink/15" />
              <span>Human approval</span>
              <span aria-hidden="true" className="h-3 w-px bg-ink/15" />
              <span>Privacy by default</span>
              <Link
                href="#trust"
                className="ml-auto text-forest underline-offset-4 hover:underline"
              >
                How this is enforced
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
