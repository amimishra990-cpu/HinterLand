import type { ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";

import {
  DevelopmentPreview,
  DocumentIntelligencePreview,
  DocumentationPreview,
  KnowledgePreview,
  PreparationPreview,
  RefinementPreview,
} from "@/components/marketing/feature-previews";
import { SectionHeading } from "@/components/shared/section-heading";
import { WordRevealText } from "@/components/shared/word-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Scope = "MVP scope" | "Later phase";

function FeatureMeta({
  index,
  status,
  centered = false,
}: {
  index: string;
  status: Scope;
  centered?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-4",
        centered && "justify-center"
      )}
    >
      <span className="tnum font-heading text-[38px] leading-none text-accent-ink">
        {index}
      </span>
      <span aria-hidden="true" className="h-px w-8 bg-ink/15" />
      <Badge variant={status === "MVP scope" ? "default" : "muted"}>
        {status}
      </Badge>
    </div>
  );
}

function Capabilities({
  items,
  centered = false,
  check = false,
}: {
  items: string[];
  centered?: boolean;
  check?: boolean;
}) {
  return (
    <ul
      data-reveal-stagger
      className={cn(
        "mt-6 gap-x-5 gap-y-2",
        centered
          ? "mx-auto flex max-w-2xl flex-wrap justify-center gap-x-6"
          : "grid sm:grid-cols-2"
      )}
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex items-start gap-2 text-[12.5px] leading-5 text-ink/70"
        >
          {check ? (
            <Check
              aria-hidden="true"
              strokeWidth={1.75}
              className="mt-0.5 size-3.5 shrink-0 text-forest"
            />
          ) : (
            <span
              aria-hidden="true"
              className="mt-2 h-px w-3 shrink-0 bg-terracotta"
            />
          )}
          {item}
        </li>
      ))}
    </ul>
  );
}

function FeatureHeader({
  index,
  title,
  description,
  status,
  capabilities,
  cta,
  centered = false,
}: {
  index: string;
  title: ReactNode;
  description: ReactNode;
  status: Scope;
  capabilities: string[];
  cta?: { label: string; href: string };
  centered?: boolean;
}) {
  return (
    <div className={cn(centered && "mx-auto max-w-2xl text-center")}>
      <div data-reveal>
        <FeatureMeta index={index} status={status} centered={centered} />
      </div>
      <h3
        data-word-reveal
        data-words-ready="true"
        className="mt-6 text-balance font-heading text-[clamp(1.9rem,3.3vw,2.5rem)] leading-[1.08] text-ink"
      >
        <WordRevealText>{title}</WordRevealText>
      </h3>
      <p
        data-reveal
        data-reveal-delay="0.08"
        className="mt-5 text-pretty text-[15.5px] leading-7 text-ink/70"
      >
        {description}
      </p>
      <Capabilities
        items={capabilities}
        centered={centered}
        check={centered}
      />
      {cta ? (
        <Button
          asChild
          variant="ghost"
          className="mt-7 -ml-2 px-2 text-forest"
        >
          <a href={cta.href}>
            {cta.label}
            <ArrowRight aria-hidden="true" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

export function FeaturesSection() {
  return (
    <section
      id="features"
      className="section-shell tone-gold border-t border-ink/10"
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <SectionHeading
          eyebrow="The features"
          title="Six capabilities that share one working context."
          lead="Hinterland is not a set of disconnected assistants. Each function reads from the same project thread and adds something reviewed back to it. Scope is labeled honestly throughout."
        />

        <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-28">
          <article
            data-reveal
            className="grid gap-10 border-t border-ink/15 pt-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-14 lg:pt-14"
          >
            <FeatureHeader
              index="01"
              status="MVP scope"
              title={
                <>
                  Communication refinement that keeps your{" "}
                  <em className="drift-word text-gold italic">intention</em>{" "}
                  intact.
                </>
              }
              description="Improve a draft for clarity, structure, tone, and persuasion without changing what you meant. The original text and your stated intention stay visible the entire time."
              capabilities={[
                "Draft and intention capture",
                "Intent-preserving refinement",
                "Ambiguity findings",
                "Audience alternatives",
                "Change explanations",
                "Grounding checks",
              ]}
              cta={{ label: "See a refinement preview", href: "#product" }}
            />
            <div data-reveal data-reveal-delay="0.12" className="lg:pl-4">
              <RefinementPreview />
            </div>
          </article>

          <article
            data-reveal
            className="border-y border-ink/10 bg-stone/25 px-5 py-12 sm:px-8 lg:-mx-4 lg:px-8 lg:py-16 xl:-mx-8"
          >
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
              <div data-reveal className="lg:pr-2">
                <PreparationPreview />
              </div>
              <FeatureHeader
                index="02"
                status="MVP scope"
                title={
                  <>
                    Walk into the meeting with something{" "}
                    <em className="drift-word text-gold italic">useful</em> to
                    contribute.
                  </>
                }
                description="Prepare talking points, questions, gaps, and risks from the sources you choose. Each item shows where it came from, and ungrounded suggestions are marked rather than disguised as fact."
                capabilities={[
                  "Meeting record and agenda",
                  "Talking points",
                  "Questions with reasons",
                  "Gaps and risks",
                  "Contribution sequence",
                  "Source transparency",
                ]}
              />
            </div>
          </article>

          <article data-reveal className="border-t border-ink/15 pt-12 lg:pt-14">
            <FeatureHeader
              index="03"
              status="MVP scope"
              title={
                <>
                  Turn a conversation into a record you can{" "}
                  <em className="drift-word text-gold italic">trust</em>.
                </>
              }
              description="Convert supplied notes or a transcript into a summary, decisions, action items, and open questions. Owners and deadlines appear only when stated. Everything else is marked as not specified."
              capabilities={[
                "Discussion points",
                "Confirmed decisions only",
                "Action items",
                "Open questions",
                "Item-level review",
                "Approval and audit trail",
              ]}
              centered
            />
            <div data-reveal data-reveal-delay="0.12" className="mt-10">
              <DocumentationPreview />
            </div>
          </article>

          <article
            data-reveal
            className="grid gap-10 border-t border-ink/15 pt-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14 lg:pt-14"
          >
            <div className="lg:sticky lg:top-28 lg:self-start">
              <FeatureHeader
                index="04"
                status="Later phase"
                title={
                  <>
                    Understand what a project document is{" "}
                    <em className="drift-word text-gold italic">missing</em>.
                  </>
                }
                description="Analyze a selected document for unsupported claims, logical gaps, inconsistencies, unclear reasoning, and missing context. Connect related documents and decisions so the project reads as one argument. This is a secondary improvement, deliberately planned after the MVP."
                capabilities={[
                  "Missing arguments",
                  "Logical gaps",
                  "Inconsistency checks",
                  "Unclear reasoning",
                  "Unsupported claims",
                  "Connected decisions",
                  "Document-to-project links",
                  "Review suggestions",
                ]}
              />
              <p className="mt-6 max-w-sm border-l-2 border-gold pl-4 text-xs leading-5 text-ink/70">
                Not available in the MVP. The preview below shows the intended
                direction, not a shipped capability.
              </p>
            </div>
            <DocumentIntelligencePreview />
          </article>

          <article
            data-reveal
            className="grid gap-10 border-t border-ink/15 pt-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 lg:pt-14"
          >
            <FeatureHeader
              index="05"
              status="Later phase"
              title={
                <>
                  Improve over time without losing your{" "}
                  <em className="drift-word text-gold italic">voice</em>.
                </>
              }
              description="Hinterland can eventually notice the patterns behind your strongest writing and offer adjustments you control. Personalization is secondary scope; advanced personalization is long-term."
              capabilities={[
                "Approved style examples",
                "Explicit feedback",
                "Visible style summary",
                "Editable observations",
                "Reset at any time",
                "Intent always preserved",
              ]}
            />
            <div>
              <div data-reveal data-reveal-delay="0.12">
                <DevelopmentPreview />
              </div>
              <p className="mt-5 max-w-md text-xs leading-5 text-ink/70">
                Planned after the MVP. Any learned preferences would remain
                visible, editable, and resettable by the user.
              </p>
            </div>
          </article>

          <article data-reveal className="border-t border-ink/15 pt-12 lg:pt-14">
            <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-14">
              <KnowledgePreview />
              <FeatureHeader
                index="06"
                status="MVP scope"
                title={
                  <>
                    Keep approved{" "}
                    <em className="drift-word text-gold italic">knowledge</em>{" "}
                    within reach.
                  </>
                }
                description="Approved meeting records become searchable by project, type, date, and topic. Drafts remain separate. You can open a record, trace every decision back to its evidence, and export the result when you need it elsewhere."
                capabilities={[
                  "Approved-only storage",
                  "Project folders",
                  "Date and topic filters",
                  "Keyword search",
                  "Record detail",
                  "Export records",
                  "Clear empty states",
                ]}
                cta={{ label: "Try the sample knowledge search", href: "#product" }}
              />
            </div>
          </article>
        </div>

        <p
          data-reveal
          className="mt-16 border-t border-ink/10 pt-6 text-xs leading-5 text-ink/70"
        >
          Interface previews use sample project data. Live generation and file
          storage are not available on this site.
        </p>
      </div>
    </section>
  );
}
