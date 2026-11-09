import {
  Building2,
  Cloud,
  Headphones,
  Mic,
  SlidersHorizontal,
} from "lucide-react";

import { FeatureCard } from "@/components/shared/feature-card";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";

const mvpCapabilities = [
  {
    title: "Context input",
    description:
      "Projects, objectives, PDF and DOCX extraction, pasted notes, source selection, and deletion.",
  },
  {
    title: "Meeting preparation",
    description:
      "Talking points, questions, gaps, risks, and a contribution sequence built from selected sources.",
  },
  {
    title: "Communication refinement",
    description:
      "Intent-preserving drafts, ambiguity findings, audience alternatives, and evidence-aware review.",
  },
  {
    title: "Meeting documentation",
    description:
      "Summaries, confirmed decisions, action items, open questions, and explicit “Not specified” states.",
  },
  {
    title: "Knowledge storage",
    description:
      "Approved-only records, project folders, date and topic filters, keyword search, and record detail.",
  },
];

const futureWork = [
  {
    icon: Headphones,
    title: "Live meeting assistance",
    description:
      "In-meeting prompts and structured capture, subject to a separate consent and reliability design.",
    status: "Planned next" as const,
  },
  {
    icon: Mic,
    title: "Audio recording & transcription",
    description:
      "Consent-based capture, speaker handling, transcription quality, and retention controls.",
    status: "Planned next" as const,
  },
  {
    icon: SlidersHorizontal,
    title: "Advanced personalization",
    description:
      "Long-term communication patterns, visible style controls, and a complete reset path.",
    status: "Long-term" as const,
  },
  {
    icon: Cloud,
    title: "Google Drive import",
    description:
      "Bring selected documents into a project without weakening owner-scoped storage.",
    status: "Long-term" as const,
  },
  {
    icon: Building2,
    title: "Enterprise workflows",
    description:
      "Organization administration, shared governance, and cross-team access models.",
    status: "Long-term" as const,
  },
];

export function RoadmapSection() {
  return (
    <section
      id="roadmap"
      className="section-shell tone-plum border-t border-ink/10"
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <SectionHeading
            eyebrow="MVP & roadmap"
            title={
              <>
                What is in the first release, and what comes{" "}
                <em className="drift-word text-gold italic">later</em>.
              </>
            }
            lead="The MVP is five connected capabilities plus the trust requirements that make them safe to use. Everything else is explicitly deferred."
          />
          <p
            data-reveal
            data-reveal-delay="0.1"
            className="max-w-sm border-l-2 border-gold pl-4 text-[12px] leading-6 text-ink/70 lg:justify-self-end lg:pb-1"
          >
            Roadmap items are direction, not commitments. No feature is
            presented as available before it exists.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div>
            <div className="flex items-center justify-between gap-3 border-b border-ink/15 pb-3">
              <p className="eyebrow">In the MVP</p>
              <Badge>Core scope</Badge>
            </div>

            <ol data-reveal-stagger>
              {mvpCapabilities.map((capability, index) => (
                <li
                  key={capability.title}
                  className="grid grid-cols-[2.25rem_1fr] gap-4 border-b border-ink/10 py-5 sm:grid-cols-[2.75rem_1fr] sm:gap-5"
                >
                  <span className="tnum pt-0.5 font-heading text-2xl text-accent-ink">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-heading text-[20px] leading-snug text-ink">
                      {capability.title}
                    </h3>
                    <p className="mt-1.5 text-[12px] leading-6 text-ink/70">
                      {capability.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>

            <p
              data-reveal
              className="mt-6 border-l-2 border-gold pl-4 text-[11.5px] leading-5 text-ink/70"
            >
              The MVP is complete only when all five capabilities and the trust
              requirements are functional together. A partial workflow does not
              count as a release.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 border-b border-ink/15 pb-3">
              <p className="eyebrow">After the MVP</p>
              <Badge variant="muted">Not scheduled</Badge>
            </div>

            <div
              data-reveal-stagger
              className="mt-5 grid gap-4 sm:grid-cols-2"
            >
              {futureWork.map((item, index) => (
                <FeatureCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.description}
                  status={item.status}
                  className={index === futureWork.length - 1 ? "sm:col-span-2" : ""}
                />
              ))}
            </div>

            <p data-reveal className="mt-5 text-[11px] leading-5 text-ink/70">
              Secondary improvements, including document intelligence and style
              examples, follow the MVP. Audio capture, live assistance, Google
              Drive import, and enterprise workflows require separate product
              and legal work.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
