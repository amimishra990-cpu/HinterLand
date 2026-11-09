import { Check, Link2, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";

function PreviewChrome({
  label,
  status,
}: {
  label: string;
  status?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-ink/10 bg-stone/35 px-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span aria-hidden="true" className="size-1.5 shrink-0 bg-forest" />
        <p className="truncate text-[9.5px] font-semibold tracking-[0.13em] text-ink/70 uppercase">
          {label}
        </p>
      </div>
      {status ? (
        <span className="shrink-0 text-[9.5px] tracking-[0.1em] text-ink/70 uppercase">
          {status}
        </span>
      ) : null}
    </div>
  );
}

export function RefinementPreview() {
  return (
    <div className="preview-card border border-ink/15 bg-background shadow-1">
      <PreviewChrome label="Refinement · Harbour proposal" status="Draft" />
      <div className="grid divide-y divide-ink/10 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        <div className="p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow text-ink/70">Original</p>
            <span className="text-[9px] tracking-[0.1em] text-ink/70 uppercase">
              Kept visible
            </span>
          </div>
          <p className="mt-3 font-heading text-[15px] leading-6 text-ink/75">
            &ldquo;I wanted to check whether we can still move the phase-two
            start. I know we discussed the pilot, but I think the timeline might
            be tight.&rdquo;
          </p>
          <div className="mt-5 border-l-2 border-gold pl-3">
            <p className="text-[9px] tracking-[0.11em] text-ink/70 uppercase">
              Stated intention
            </p>
            <p className="mt-1 text-[11.5px] leading-5 text-ink/70">
              Ask for a decision without sounding defensive.
            </p>
          </div>
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow whitespace-nowrap text-forest">
              Refined · for review
            </p>
            <span className="shrink-0 text-[9px] tracking-[0.1em] text-ink/70 uppercase">
              Variant 1/2
            </span>
          </div>
          <p className="mt-3 font-heading text-[15px] leading-6 text-ink">
            &ldquo;Could we confirm whether phase two can start after the pilot
            review? That would keep the timeline tied to the outcome we agreed
            on.&rdquo;
          </p>
          <ul className="mt-5 space-y-2 border-t border-ink/10 pt-4">
            <li className="flex gap-2 text-[11px] leading-5 text-ink/70">
              <Check
                aria-hidden="true"
                strokeWidth={1.75}
                className="mt-0.5 size-3 shrink-0 text-forest"
              />
              Meaning preserved; the request made explicit.
            </li>
            <li className="flex gap-2 text-[11px] leading-5 text-ink/70">
              <Check
                aria-hidden="true"
                strokeWidth={1.75}
                className="mt-0.5 size-3 shrink-0 text-forest"
              />
              &ldquo;Might be tight&rdquo; replaced with a concrete decision
              point.
            </li>
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 bg-stone/30 px-4 py-3">
        <p className="flex items-center gap-1.5 text-[10.5px] text-ink/70">
          <Link2 aria-hidden="true" strokeWidth={1.5} className="size-3.5 text-forest" />
          Evidence · Pilot review notes [1]
        </p>
        <Badge variant="outline">Awaiting approval</Badge>
      </div>
    </div>
  );
}

export function PreparationPreview() {
  return (
    <div className="preview-card border border-ink/15 bg-background shadow-1">
      <PreviewChrome label="Preparation · Pilot review" status="Brief · draft" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-heading text-[21px] leading-tight text-ink">
              Pilot review
            </p>
            <p className="mt-1 text-[11px] text-ink/70">
              Thursday · 4:00 pm · 45 minutes
            </p>
          </div>
          <Badge variant="outline">6 items</Badge>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="eyebrow text-ink/70">What the sources establish</p>
            <ul className="mt-3 space-y-2.5">
              <li className="text-[11.5px] leading-5 text-ink/70">
                The pilot ran for six weeks across two teams.{" "}
                <span className="text-[9px] text-forest">[1]</span>
              </li>
              <li className="text-[11.5px] leading-5 text-ink/70">
                Phase two depends on the review outcome.{" "}
                <span className="text-[9px] text-forest">[1][2]</span>
              </li>
              <li className="text-[11.5px] leading-5 text-ink/70">
                The review criteria were discussed, not finalized.{" "}
                <span className="text-[9px] text-forest">[2]</span>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow text-ink/70">Questions to raise</p>
            <ul className="mt-3 space-y-3">
              <li>
                <p className="text-[11.5px] leading-5 text-ink/75">
                  Which metric decides the review outcome?
                </p>
                <p className="mt-0.5 text-[9.5px] leading-4 text-ink/70">
                  Why · the sources name no criterion.
                </p>
              </li>
              <li>
                <p className="text-[11.5px] leading-5 text-ink/75">
                  Who signs off on phase two?
                </p>
                <p className="mt-0.5 text-[9.5px] leading-4 text-ink/70">
                  Why · no owner appears in the notes.
                </p>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-6 flex items-start gap-2 border border-terracotta/50 bg-terracotta/[0.06] px-3 py-2.5">
          <span
            aria-hidden="true"
            className="mt-1.5 size-1.5 shrink-0 bg-terracotta"
          />
          <p className="text-[11px] leading-5 text-ink/70">
            <span className="font-semibold text-ink">Gap · </span>
            No review owner or deadline is stated in the supplied notes. Both
            are marked &ldquo;Not specified.&rdquo;
          </p>
        </div>
      </div>
    </div>
  );
}

function RecordColumn({
  title,
  count,
  items,
}: {
  title: string;
  count: string;
  items: Array<{ text: string; cite: string; note?: string }>;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 border-b border-ink/15 pb-2">
        <p className="text-[9.5px] font-semibold tracking-[0.11em] text-ink/70 uppercase">
          {title}
        </p>
        <span className="tnum font-heading text-lg leading-none text-accent-ink">
          {count}
        </span>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li key={item.text} className="text-[11.5px] leading-5 text-ink/75">
            {item.text}{" "}
            <span className="text-[9px] text-forest">{item.cite}</span>
            {item.note ? (
              <span className="mt-1.5 block w-fit border border-terracotta/40 px-1.5 py-0.5 text-[8.5px] font-semibold tracking-[0.08em] text-ink/70 uppercase">
                {item.note}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DocumentationPreview() {
  return (
    <div className="preview-card border border-ink/15 bg-background shadow-1">
      <PreviewChrome label="Meeting record · Pilot review" status="Approved sample" />
      <div className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4">
          <div>
            <p className="font-heading text-[22px] leading-tight text-ink">
              Pilot review
            </p>
            <p className="mt-1 text-[11px] text-ink/70">
              24 October · Summary generated from supplied notes
            </p>
          </div>
          <Badge variant="outline">Approved</Badge>
        </div>

        <div className="mt-4">
          <p className="eyebrow text-ink/70">Summary</p>
          <p className="mt-2 max-w-2xl text-[12.5px] leading-6 text-ink/70">
            The team reviewed the six-week pilot, confirmed that phase two
            depends on the review outcome, and left the review owner and
            deadline unspecified.
          </p>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-3">
          <RecordColumn
            title="Decisions"
            count="1"
            items={[
              {
                text: "Phase two starts only after the pilot review.",
                cite: "[1]",
              },
            ]}
          />
          <RecordColumn
            title="Action items"
            count="2"
            items={[
              {
                text: "Prepare the review summary.",
                cite: "[2]",
                note: "Owner · Not specified",
              },
              {
                text: "Confirm the phase-two scope.",
                cite: "[2]",
                note: "Deadline · Not specified",
              },
            ]}
          />
          <RecordColumn
            title="Open questions"
            count="2"
            items={[
              { text: "Which metric decides the outcome?", cite: "[1]" },
              { text: "Who signs off on phase two?", cite: "[1]" },
            ]}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5 border-t border-ink/10 bg-stone/30 px-4 py-3 text-[10.5px] text-ink/70">
        <Link2 aria-hidden="true" strokeWidth={1.5} className="size-3.5 text-forest" />
        Every item keeps a visible link to its source excerpt.
      </div>
    </div>
  );
}

export function DocumentIntelligencePreview() {
  return (
    <div className="preview-card border border-ink/15 bg-background shadow-1">
      <div className="border-b border-terracotta/40 bg-terracotta/[0.07] px-4 py-2.5 text-[9.5px] font-semibold tracking-[0.12em] text-ink/70 uppercase">
        Concept preview · Not in the MVP
      </div>
      <PreviewChrome
        label="Document analysis · Research proposal"
        status="Read-only sample"
      />
      <div className="grid sm:grid-cols-[1fr_170px]">
        <div className="p-5">
          <p className="eyebrow text-ink/70">Section 3 · Methodology</p>
          <div className="mt-3 space-y-3 font-heading text-[13.5px] leading-6 text-ink/75">
            <p>
              The proposed sample spans two departments and will be compared
              against last year&rsquo;s results.
            </p>
            <p className="border-b-2 border-terracotta/50 pb-0.5">
              This approach will produce a representative view of the
              organisation.
            </p>
            <p>
              The review process follows the same structure used in the pilot.
            </p>
          </div>
          <div className="mt-5 border-l-2 border-terracotta pl-3">
            <p className="text-[9px] tracking-[0.11em] text-ink/70 uppercase">
              Finding
            </p>
            <p className="mt-1 text-[11.5px] leading-5 text-ink/70">
              The representativeness claim has no supporting citation or method
              for sampling.
            </p>
          </div>
        </div>

        <div className="border-t border-ink/10 bg-stone/25 p-4 sm:border-t-0 sm:border-l">
          <p className="eyebrow text-ink/70">Findings</p>
          <ul className="mt-3 space-y-3 text-[10.5px] leading-5 text-ink/70">
            <li>
              <span className="tnum text-accent-ink">01</span> Claim without
              support
            </li>
            <li>
              <span className="tnum text-accent-ink">02</span> Missing
              counterargument
            </li>
            <li>
              <span className="tnum text-accent-ink">03</span> Unclear reference
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink/10 px-4 py-3 text-[10.5px] text-ink/70">
        Findings are suggestions for review. No content is rewritten or saved
        automatically.
      </div>
    </div>
  );
}

export function DevelopmentPreview() {
  const observations = [
    {
      meta: "Sample observation · 3 drafts",
      title: "You lead with context.",
      detail:
        "Your clearest refinements open with the reason before the request.",
    },
    {
      meta: "Suggested pattern",
      title: "Short asks land better.",
      detail:
        "Requests under 90 words kept the decision point visible for the reader.",
    },
    {
      meta: "Always editable",
      title: "Your voice stays yours.",
      detail:
        "Examples guide structure and tone; they never overwrite your intention.",
    },
  ];

  return (
    <div className="border-y border-ink/15 py-7">
      <div className="grid gap-6 sm:grid-cols-3">
        {observations.map((observation) => (
          <div
            key={observation.title}
            className="border-l border-ink/15 pl-4"
          >
            <p className="text-[9px] tracking-[0.1em] text-ink/70 uppercase">
              {observation.meta}
            </p>
            <p className="mt-2 font-heading text-[18px] leading-snug text-ink">
              {observation.title}
            </p>
            <p className="mt-1.5 text-[11.5px] leading-5 text-ink/70">
              {observation.detail}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-4">
        <p className="text-[10.5px] text-ink/70">
          Observations are visible, editable, and resettable by the user.
        </p>
        <Badge variant="muted">Planned · later phase</Badge>
      </div>
    </div>
  );
}

const knowledgeResults = [
  {
    title: "Pilot review — 24 October",
    snippet:
      "Phase two begins after the pilot review; the timeline remains tied to that outcome.",
    type: "Decision · Project Harbour",
  },
  {
    title: "Phase-two planning — 2 October",
    snippet:
      "The pilot timeline was set at six weeks, with a review before any phase-two commitment.",
    type: "Decision · Project Harbour",
  },
  {
    title: "Scope review — 18 September",
    snippet:
      "Open question: which metric decides the pilot outcome and who owns the review?",
    type: "Open question · Project Harbour",
  },
];

export function KnowledgePreview() {
  return (
    <div className="preview-card border border-ink/15 bg-background shadow-1">
      <PreviewChrome
        label="Knowledge · Harbour proposal"
        status="3 approved records"
      />
      <div className="border-b border-ink/10 p-4">
        <div className="flex items-center gap-2.5 border border-input bg-background px-3 py-2.5">
          <Search aria-hidden="true" strokeWidth={1.5} className="size-4 text-forest" />
          <span className="text-[13px] text-ink/75">pilot timeline</span>
          <span className="ml-auto border-l border-ink/10 pl-2 text-[9px] tracking-[0.1em] text-ink/70 uppercase">
            Keyword
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Project · Harbour", "Type · Meeting record", "Approved only"].map(
            (filter) => (
              <span
                key={filter}
                className="border border-ink/15 px-2 py-1 text-[9px] tracking-[0.06em] text-ink/70 uppercase"
              >
                {filter}
              </span>
            )
          )}
        </div>
      </div>

      <ul className="divide-y divide-ink/10">
        {knowledgeResults.map((result) => (
          <li key={result.title} className="px-4 py-3.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-heading text-[14px] leading-snug text-ink">
                {result.title}
              </p>
              <span className="shrink-0 text-[9px] tracking-[0.1em] text-forest uppercase">
                Approved
              </span>
            </div>
            <p className="mt-1 text-[10.5px] leading-5 text-ink/70">
              &ldquo;{result.snippet}&rdquo;
            </p>
            <p className="mt-1.5 text-[9px] tracking-[0.05em] text-ink/70 uppercase">
              {result.type}
            </p>
          </li>
        ))}
      </ul>

      <div className="border-t border-ink/10 bg-stone/30 px-4 py-3 text-[10.5px] text-ink/70">
        Results come from approved records only. Drafts stay separate.
      </div>
    </div>
  );
}
