import Link from "next/link";
import { Check } from "lucide-react";

import { SectionHeading } from "@/components/shared/section-heading";

const steps = [
  {
    title: "Context input",
    description:
      "Create a project, state its objectives, and select the documents, notes, or agenda that should inform the work.",
  },
  {
    title: "Meeting preparation",
    description:
      "Turn selected context into talking points, questions, gaps, and a contribution sequence for the discussion.",
  },
  {
    title: "Communication refinement",
    description:
      "Improve a draft for its audience while preserving the original text, stated intention, and any commitments.",
  },
  {
    title: "Meeting documentation",
    description:
      "Convert supplied notes into a reviewable summary with decisions, action items, and open questions.",
  },
  {
    title: "Knowledge storage",
    description:
      "Approve the record, then find it later by project, date, type, and keyword. Drafts stay out of knowledge.",
  },
];

export function WorkflowSection() {
  return (
    <section
      id="workflow"
      className="section-shell tone-plum border-t border-ink/10 bg-stone/20"
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <SectionHeading
            eyebrow="The workflow"
            title="From scattered information to meaningful outcomes."
          />
          <p
            data-reveal
            data-reveal-delay="0.1"
            className="max-w-md text-pretty text-[16px] leading-7 text-ink/70 lg:justify-self-end lg:pb-1"
          >
            The MVP follows five connected steps. Each one keeps its sources
            visible and waits for your review before anything is saved.
          </p>
        </div>

        <div className="relative mt-14">
          <span
            aria-hidden="true"
            data-reveal
            className="absolute top-2 bottom-2 left-[13px] w-px bg-gradient-to-b from-gold/50 via-terracotta/40 to-ink/10 lg:top-[7px] lg:right-0 lg:bottom-auto lg:left-0 lg:h-px lg:w-auto lg:bg-gradient-to-r"
          />

          <ol data-reveal-stagger className="grid gap-9 lg:grid-cols-5 lg:gap-0">
            {steps.map((step, index) => (
              <li
                key={step.title}
                className="relative pl-10 lg:pr-5 lg:pl-0 lg:pt-10"
              >
                <span
                  aria-hidden="true"
                  className="thread-dot absolute top-[5px] left-[13px] size-[7px] -translate-x-1/2 rounded-full bg-terracotta ring-4 ring-stone/20 lg:top-[4px] lg:left-0 lg:ring-background"
                  style={{ animationDelay: `${index * -0.8}s` }}
                />
                <span className="tnum block font-heading text-[36px] leading-none text-accent-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 font-heading text-[22px] leading-snug text-ink lg:min-h-[3.75rem]">
                  {step.title}
                </h3>
                <p className="mt-2 max-w-[15rem] text-[12.5px] leading-5 text-ink/70">
                  {step.description}
                </p>
                <p className="mt-4 text-[9px] font-semibold tracking-[0.12em] text-forest uppercase">
                  MVP capability
                </p>
              </li>
            ))}
          </ol>
        </div>

        <div
          data-reveal
          className="mt-14 flex flex-col justify-between gap-4 border-t border-ink/15 pt-6 sm:flex-row sm:items-center"
        >
          <p className="flex items-start gap-2 text-[12.5px] leading-5 text-ink/70">
            <Check
              aria-hidden="true"
              strokeWidth={1.75}
              className="mt-0.5 size-4 shrink-0 text-forest"
            />
            Every step is reviewable. Nothing enters knowledge without explicit
            approval.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              href="#experience"
              className="text-[11px] font-semibold tracking-[0.1em] text-forest uppercase underline-offset-4 hover:underline"
            >
              See the stages in motion
            </Link>
            <Link
              href="#principles"
              className="text-[11px] font-semibold tracking-[0.1em] text-forest uppercase underline-offset-4 hover:underline"
            >
              See the principles
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
