import type { LucideIcon } from "lucide-react";
import { BookOpen, Check, FileText, Library, PenLine, Users } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

const leftNodes: Array<{ icon: LucideIcon; title: string; detail: string }> = [
  {
    icon: PenLine,
    title: "Intent & audience",
    detail: "What you mean, and who needs to understand it.",
  },
  {
    icon: FileText,
    title: "Project objectives",
    detail: "The outcome the work is meant to serve.",
  },
  {
    icon: BookOpen,
    title: "Source documents",
    detail: "Selected material, visible and removable.",
  },
];

const rightNodes: Array<{ icon: LucideIcon; title: string; detail: string }> = [
  {
    icon: Users,
    title: "Meeting preparation",
    detail: "Talking points, questions, and gaps.",
  },
  {
    icon: Check,
    title: "Decisions & actions",
    detail: "Only what the supplied material supports.",
  },
  {
    icon: Library,
    title: "Approved knowledge",
    detail: "A durable record for the next conversation.",
  },
];

function DiagramNode({
  icon: Icon,
  title,
  detail,
  side,
}: {
  icon: LucideIcon;
  title: string;
  detail: string;
  side: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-5 lg:p-6",
        side === "right" && "md:flex-row-reverse md:text-right"
      )}
    >
      <span className="grid size-9 shrink-0 place-items-center border border-ink/15 text-forest">
        <Icon aria-hidden="true" strokeWidth={1.5} className="size-4" />
      </span>
      <div>
        <p className="text-[13.5px] font-medium text-ink">{title}</p>
        <p className="mt-1 text-[11.5px] leading-5 text-ink/70">{detail}</p>
      </div>
    </div>
  );
}

export function SolutionSection() {
  return (
    <section id="solution" className="section-shell tone-navy border-t border-ink/10 bg-stone/20">
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <SectionHeading
            eyebrow="The solution"
            title={
              <>
                Everything connected. Nothing{" "}
                <em className="drift-word text-gold italic">important</em>{" "}
                forgotten.
              </>
            }
          />
          <div data-reveal data-reveal-delay="0.1" className="lg:pb-1">
            <p className="text-pretty text-[16px] leading-7 text-ink/70">
              Hinterland keeps a project&rsquo;s working context in one place.
              Each step adds to the same thread instead of creating another
              disconnected artefact.
            </p>
            <ul className="mt-5 grid gap-2 text-[11px] font-medium text-ink/75 sm:grid-cols-3 lg:grid-cols-1">
              {[
                "Context continuity",
                "Connected professional information",
                "Unified intelligence workflow",
              ].map((pillar) => (
                <li key={pillar} className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-1 shrink-0 bg-gold" />
                  {pillar}
                </li>
              ))}
            </ul>
            <p className="mt-5 flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.13em] text-forest uppercase">
              <span aria-hidden="true" className="size-1.5 bg-forest" />
              One project · one context thread
            </p>
          </div>
        </div>

        <div data-reveal className="mt-14 overflow-hidden border border-ink/15 bg-background">
          <div className="grid md:grid-cols-[1fr_300px_1fr] lg:grid-cols-[1fr_340px_1fr]">
            <div data-reveal-stagger className="divide-y divide-ink/10">
              {leftNodes.map((node) => (
                <DiagramNode key={node.title} {...node} side="left" />
              ))}
            </div>

            <div data-reveal data-reveal-delay="0.12" className="flex flex-col justify-between gap-10 border-y border-gold/25 bg-emerald px-7 py-8 text-ivory md:border-x md:border-y-0 lg:px-9 lg:py-10">
              <div>
                <div className="flex items-center gap-2.5">
                  <span aria-hidden="true" className="h-px w-6 bg-gold" />
                  <p className="text-[10px] font-semibold tracking-[0.16em] text-gold uppercase">
                    The thread
                  </p>
                </div>
                <h3 className="mt-5 text-balance font-heading text-[30px] leading-[1.12] text-ivory">
                  One working context, visible at every step.
                </h3>
                <p className="mt-4 max-w-xs text-[13px] leading-6 text-ivory/70">
                  Intent, sources, preparation, communication, decisions, and
                  approved records stay inside the project they belong to.
                </p>
              </div>

              <div>
                <p className="border-t border-ivory/20 pt-4 text-[10.5px] leading-5 tracking-[0.06em] text-ivory/70">
                  The MVP connects context, preparation, refinement, approved
                  meeting records, and keyword search.
                </p>
              </div>
            </div>

            <div data-reveal-stagger className="divide-y divide-ink/10">
              {rightNodes.map((node) => (
                <DiagramNode key={node.title} {...node} side="right" />
              ))}
            </div>
          </div>
        </div>

        <p className="mt-5 text-xs leading-5 text-ink/70">
          Diagram describes the product model. Document intelligence and
          personalization are planned after the MVP.
        </p>
      </div>
    </section>
  );
}
