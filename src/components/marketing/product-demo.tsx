"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  FileText,
  Link2,
  PenLine,
  Search,
  Users,
} from "lucide-react";

import { EmptyState } from "@/components/shared/states";
import { SectionHeading } from "@/components/shared/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type EvidenceKey = "reviewNotes" | "scopeDocument";

const evidence: Record<
  EvidenceKey,
  { source: string; location: string; quote: string }
> = {
  reviewNotes: {
    source: "Pilot review notes",
    location: "Pasted note · section 2 · 12 October",
    quote:
      "Phase two begins only after the pilot review is complete. The review owner and date were not recorded.",
  },
  scopeDocument: {
    source: "Pilot scope document",
    location: "Project document · section 2 · page 3",
    quote:
      "The pilot runs for six weeks across two teams. Phase-two scope is confirmed at the review.",
  },
};

function EvidenceButton({
  evidenceKey,
  children,
}: {
  evidenceKey: EvidenceKey;
  children: ReactNode;
}) {
  const item = evidence[evidenceKey];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex min-h-6 items-center gap-1 text-[10px] font-medium text-forest underline decoration-forest/30 underline-offset-2 transition-colors hover:decoration-forest"
        >
          {children}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <p className="eyebrow">Evidence reference</p>
          <DialogTitle>{item.source}</DialogTitle>
          <DialogDescription>{item.location}</DialogDescription>
        </DialogHeader>

        <blockquote className="border-l-2 border-gold bg-stone/25 px-4 py-3 font-heading text-[16px] leading-7 text-ink">
          &ldquo;{item.quote}&rdquo;
        </blockquote>

        <p className="flex items-start gap-2 text-[12px] leading-5 text-ink/70">
          <Check
            aria-hidden="true"
            strokeWidth={1.75}
            className="mt-0.5 size-3.5 shrink-0 text-forest"
          />
          <span>
            <span className="font-medium text-forest">
              Verified against source.
            </span>{" "}
            This is a sample excerpt shown for preview.
          </span>
        </p>

        <p className="border-t border-ink/10 pt-4 text-[10.5px] leading-5 text-ink/70">
          Evidence dialogs are illustrative. No source files are connected to
          this site.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function PreviewAction({
  label,
  variant = "outline",
}: {
  label: string;
  variant?: "default" | "outline";
}) {
  const reason = "Unavailable in this preview. No data is saved.";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          aria-label={`${label} — ${reason}`}
          className="inline-flex"
        >
          <Button disabled size="sm" variant={variant}>
            {label}
          </Button>
        </span>
      </TooltipTrigger>
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  );
}

function RefinementDemo() {
  const [intention, setIntention] = useState(
    "Ask for a decision on the timeline without sounding defensive."
  );

  return (
    <div className="grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="eyebrow text-ink/70">Original draft</p>
          <span className="text-[9px] tracking-[0.1em] text-ink/70 uppercase">
            Kept visible
          </span>
        </div>
        <div className="mt-3 border border-ink/10 bg-stone/20 p-4 font-heading text-[15px] leading-6 text-ink/80">
          &ldquo;I wanted to check whether we can still move the phase-two
          start. I know we discussed the pilot, but I think the timeline might
          be tight.&rdquo;
        </div>

        <div className="mt-5">
          <Label
            htmlFor="preview-intention"
            className="text-[10px] font-semibold tracking-[0.1em] text-ink/70 uppercase"
          >
            Stated intention
          </Label>
          <Textarea
            id="preview-intention"
            value={intention}
            onChange={(event) => setIntention(event.target.value)}
            className="mt-2 min-h-20 text-[13px] leading-6"
          />
          <p className="mt-2 text-[10.5px] leading-5 text-ink/70">
            Editable for this preview. Nothing is sent or saved.
          </p>
        </div>
      </div>

      <div className="border border-ink/15 bg-background">
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-4 py-2.5">
          <p className="eyebrow text-forest">Refined · draft</p>
          <Badge variant="outline">Awaiting approval</Badge>
        </div>

        <div className="p-4 sm:p-5">
          <p className="font-heading text-[16px] leading-7 text-ink">
            &ldquo;Could we confirm whether phase two can start after the pilot
            review? That would keep the timeline tied to the outcome we agreed
            on.&rdquo;
          </p>

          <div className="mt-5 space-y-3 border-t border-ink/10 pt-4">
            <div>
              <p className="text-[9.5px] tracking-[0.1em] text-ink/70 uppercase">
                Change · structure
              </p>
              <p className="mt-1 text-[11.5px] leading-5 text-ink/70">
                The request moves to the opening sentence; the rationale
                follows it.
              </p>
            </div>
            <div>
              <p className="text-[9.5px] tracking-[0.1em] text-ink/70 uppercase">
                Change · tone
              </p>
              <p className="mt-1 text-[11.5px] leading-5 text-ink/70">
                &ldquo;Might be tight&rdquo; becomes a concrete decision point
                instead of a hedge.
              </p>
            </div>
            <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-ink/70">
              <Link2
                aria-hidden="true"
                strokeWidth={1.5}
                className="size-3.5 text-forest"
              />
              Evidence
              <EvidenceButton evidenceKey="reviewNotes">
                [1] Pilot review notes
              </EvidenceButton>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 bg-stone/30 p-3">
          <PreviewAction label="Approve and save" variant="default" />
          <PreviewAction label="Copy refined text" />
          <span className="text-[10px] text-ink/70">Preview actions only</span>
        </div>
      </div>
    </div>
  );
}

function PreparationDemo() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <p className="eyebrow text-ink/70">Meeting brief · Draft</p>
          <h4 className="mt-2 font-heading text-2xl leading-tight text-ink">
            Pilot review
          </h4>
          <p className="mt-1 text-[11px] leading-5 text-ink/70">
            Thursday · 4:00 pm · 45 minutes · Agenda source selected
          </p>
        </div>
        <Badge variant="outline">Sample brief</Badge>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
            Contribution sequence
          </p>
          <ol className="mt-3 space-y-4">
            {[
              {
                number: "01",
                title: "Open with the review outcome.",
                detail:
                  "Anchor the discussion in what the six-week pilot measured.",
                evidenceKey: "scopeDocument" as EvidenceKey,
                cite: "[1]",
              },
              {
                number: "02",
                title: "Ask who owns the phase-two decision.",
                detail: "The supplied notes name no decision owner.",
                evidenceKey: "reviewNotes" as EvidenceKey,
                cite: "[2]",
              },
              {
                number: "03",
                title: "Leave with a dated next step.",
                detail:
                  "No deadline appears in the material, so this is framed as a question.",
                evidenceKey: "reviewNotes" as EvidenceKey,
                cite: "[2]",
              },
            ].map((item) => (
              <li key={item.number} className="flex gap-3">
                <span className="tnum font-heading text-lg leading-6 text-accent-ink">
                  {item.number}
                </span>
                <div>
                  <p className="text-[12.5px] leading-5 font-medium text-ink">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11px] leading-5 text-ink/70">
                    {item.detail}{" "}
                    <EvidenceButton evidenceKey={item.evidenceKey}>
                      {item.cite}
                    </EvidenceButton>
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
            Questions to raise
          </p>
          <ul className="mt-3 space-y-4">
            <li>
              <p className="text-[12.5px] leading-5 text-ink">
                Which metric decides the review outcome?
              </p>
              <p className="mt-1 text-[10.5px] leading-5 text-ink/70">
                Why · the sources name no criterion.
              </p>
            </li>
            <li>
              <p className="text-[12.5px] leading-5 text-ink">
                Who signs off on phase two?
              </p>
              <p className="mt-1 text-[10.5px] leading-5 text-ink/70">
                Why · no owner appears in the notes.
              </p>
            </li>
            <li>
              <p className="text-[12.5px] leading-5 text-ink">
                What would make the review inconclusive?
              </p>
              <p className="mt-1 text-[10.5px] leading-5 text-ink/70">
                Why · the pilot scope defines no failure condition.
              </p>
            </li>
          </ul>

          <div className="mt-5 border border-terracotta/50 bg-terracotta/[0.06] p-3">
            <div className="flex gap-2">
              <AlertCircle
                aria-hidden="true"
                strokeWidth={1.5}
                className="mt-0.5 size-3.5 shrink-0 text-accent-ink"
              />
              <p className="text-[11px] leading-5 text-ink/70">
                <span className="font-semibold text-ink">Gap · </span>
                No review owner or deadline is stated. Both remain marked as
                &ldquo;Not specified&rdquo; rather than inferred.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryTab() {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-ink/10 pb-4">
        <div>
          <p className="eyebrow text-ink/70">Meeting record · Sample</p>
          <h4 className="mt-2 font-heading text-2xl leading-tight text-ink">
            Pilot review
          </h4>
          <p className="mt-1 text-[11px] leading-5 text-ink/70">
            24 October · Generated from supplied notes · Item-level review
          </p>
        </div>
        <Badge variant="attention">Needs review</Badge>
      </div>

      <div className="mt-4">
        <p className="text-[10px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
          Summary
        </p>
        <p className="mt-2 max-w-3xl text-[12.5px] leading-6 text-ink/70">
          The team reviewed the six-week pilot, confirmed that phase two depends
          on the review outcome, and left the review owner and deadline
          unspecified.
        </p>
      </div>

      <div className="mt-5 grid gap-5 border-t border-ink/10 pt-5 sm:grid-cols-3">
        <div>
          <div className="flex items-baseline justify-between border-b border-ink/15 pb-2">
            <p className="text-[9.5px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
              Decisions
            </p>
            <span className="tnum font-heading text-lg text-accent-ink">
              1
            </span>
          </div>
          <p className="mt-3 text-[11.5px] leading-5 text-ink/70">
            Phase two begins only after the pilot review.{" "}
            <EvidenceButton evidenceKey="reviewNotes">[1]</EvidenceButton>
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between border-b border-ink/15 pb-2">
            <p className="text-[9.5px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
              Action items
            </p>
            <span className="tnum font-heading text-lg text-accent-ink">
              2
            </span>
          </div>
          <div className="mt-3 space-y-3">
            <div>
              <p className="text-[11.5px] leading-5 text-ink/70">
                Prepare the review summary.{" "}
                <EvidenceButton evidenceKey="scopeDocument">[2]</EvidenceButton>
              </p>
              <span className="mt-1 inline-block border border-terracotta/40 px-1.5 py-0.5 text-[8.5px] font-semibold tracking-[0.08em] text-ink/70 uppercase">
                Owner · Not specified
              </span>
            </div>
            <div>
              <p className="text-[11.5px] leading-5 text-ink/70">
                Confirm the phase-two scope.{" "}
                <EvidenceButton evidenceKey="scopeDocument">[2]</EvidenceButton>
              </p>
              <span className="mt-1 inline-block border border-terracotta/40 px-1.5 py-0.5 text-[8.5px] font-semibold tracking-[0.08em] text-ink/70 uppercase">
                Deadline · Not specified
              </span>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between border-b border-ink/15 pb-2">
            <p className="text-[9.5px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
              Open questions
            </p>
            <span className="tnum font-heading text-lg text-accent-ink">
              2
            </span>
          </div>
          <div className="mt-3 space-y-2">
            <p className="text-[11.5px] leading-5 text-ink/70">
              Which metric decides the outcome?{" "}
              <EvidenceButton evidenceKey="reviewNotes">[1]</EvidenceButton>
            </p>
            <p className="text-[11.5px] leading-5 text-ink/70">
              Who signs off on phase two?{" "}
              <EvidenceButton evidenceKey="reviewNotes">[1]</EvidenceButton>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-3 border-t border-ink/10 pt-4 sm:flex-row sm:items-center">
        <p className="flex items-start gap-2 text-[11px] leading-5 text-ink/70">
          <AlertCircle
            aria-hidden="true"
            strokeWidth={1.5}
            className="mt-0.5 size-3.5 shrink-0 text-accent-ink"
          />
          One action item has no stated owner. Approval remains blocked until
          the item is resolved.
        </p>
        <PreviewAction label="Approve record" variant="default" />
      </div>
    </div>
  );
}

const findings = [
  {
    title: "Claim without support",
    detail:
      "The representativeness claim has no citation or described sampling method.",
    question: "What sampling method supports this claim?",
  },
  {
    title: "Missing counterargument",
    detail:
      "The section does not consider departments that opted out of the pilot.",
    question: "How would opt-out departments change the result?",
  },
  {
    title: "Unclear reference",
    detail:
      "“The same structure used in the pilot” names no section or source.",
    question: "Which pilot document defines this structure?",
  },
];

function DocumentTab() {
  const [active, setActive] = useState(0);
  const finding = findings[active];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-terracotta/35 bg-terracotta/[0.06] px-4 py-2.5">
        <p className="text-[9.5px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
          Concept preview · Secondary scope
        </p>
        <p className="text-[9.5px] text-ink/70">
          No document is uploaded or analyzed.
        </p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_0.72fr]">
        <div>
          <p className="eyebrow text-ink/70">Research proposal · Section 3</p>
          <div className="mt-3 space-y-3 font-heading text-[15px] leading-7 text-ink/75">
            <p>
              The proposed sample spans two departments and will be compared
              against last year&rsquo;s results.
            </p>
            <p className="border-b-2 border-terracotta/50 pb-0.5 text-ink">
              This approach will produce a representative view of the
              organisation.
            </p>
            <p>
              The review process follows the same structure used in the pilot.
            </p>
          </div>

          <div className="mt-6 border border-ink/10 bg-stone/20 p-4">
            <p className="text-[9.5px] tracking-[0.1em] text-ink/70 uppercase">
              Selected finding
            </p>
            <p className="mt-2 text-[12.5px] leading-6 text-ink/70">
              {finding.detail}
            </p>
            <p className="mt-3 text-[9.5px] tracking-[0.1em] text-ink/70 uppercase">
              Suggested question
            </p>
            <p className="mt-1 font-heading text-[15px] leading-6 text-ink">
              {finding.question}
            </p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
            Findings · 3
          </p>
          <div className="mt-3 divide-y divide-ink/10 border-y border-ink/10">
            {findings.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={active === index}
                className={`flex w-full items-baseline gap-3 py-3 text-left transition-colors hover:bg-stone/25 focus-visible:bg-stone/25 ${
                  active === index ? "text-ink" : "text-ink/70"
                }`}
              >
                <span className="tnum text-[10px] text-accent-ink">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[11.5px] leading-5">{item.title}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-[10px] leading-5 text-ink/70">
            Suggestions point to a place for review. They do not rewrite the
            document.
          </p>
        </div>
      </div>
    </div>
  );
}

const sampleRecords = [
  {
    title: "Pilot review — 24 October",
    type: "Decision",
    snippet:
      "Phase two begins after the pilot review; the timeline remains tied to that outcome.",
  },
  {
    title: "Phase-two planning — 2 October",
    type: "Decision",
    snippet:
      "The pilot timeline was set at six weeks, with a review before any phase-two commitment.",
  },
  {
    title: "Scope review — 18 September",
    type: "Open question",
    snippet:
      "Which metric decides the pilot outcome, and who owns the review?",
  },
  {
    title: "Partner sync — 9 September",
    type: "Action item",
    snippet:
      "Confirm the pilot scope with both teams. Owner and deadline were not stated.",
  },
  {
    title: "Kickoff — 21 August",
    type: "Decision",
    snippet:
      "The pilot starts with two teams and runs for six weeks before review.",
  },
];

function KnowledgeTab() {
  const [query, setQuery] = useState("");
  const normalized = query.trim().toLowerCase();
  const results = normalized
    ? sampleRecords.filter((record) =>
        `${record.title} ${record.type} ${record.snippet}`
          .toLowerCase()
          .includes(normalized)
      )
    : sampleRecords;

  return (
    <div>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div className="w-full sm:max-w-sm">
          <Label
            htmlFor="knowledge-query"
            className="text-[10px] font-semibold tracking-[0.1em] text-ink/70 uppercase"
          >
            Search sample records
          </Label>
          <div className="relative mt-2">
            <Search
              aria-hidden="true"
              strokeWidth={1.5}
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-forest"
            />
            <Input
              id="knowledge-query"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try “pilot” or “scope”"
              className="pl-10"
            />
          </div>
          <p className="mt-2 text-[10.5px] leading-5 text-ink/70">
            Search runs locally across five sample records. No library is
            connected.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {["Project · Harbour", "Approved only"].map((filter) => (
            <span
              key={filter}
              className="border border-ink/15 px-2 py-1 text-[9px] tracking-[0.06em] text-ink/70 uppercase"
            >
              {filter}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-y border-ink/10 py-2">
        <p className="text-[9.5px] font-semibold tracking-[0.1em] text-ink/70 uppercase">
          Approved records
        </p>
        <p className="tnum text-[10.5px] text-ink/70">
          {results.length} of {sampleRecords.length}
        </p>
      </div>

      {results.length > 0 ? (
        <ul className="divide-y divide-ink/10">
          {results.map((record) => (
            <li key={record.title} className="py-3.5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-heading text-[14.5px] leading-snug text-ink">
                  {record.title}
                </p>
                <span className="text-[9px] tracking-[0.1em] text-forest uppercase">
                  Approved
                </span>
              </div>
              <p className="mt-1 text-[11px] leading-5 text-ink/70">
                &ldquo;{record.snippet}&rdquo;
              </p>
              <p className="mt-1.5 text-[9px] tracking-[0.05em] text-ink/70 uppercase">
                {record.type} · Project Harbour
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          className="mt-5"
          icon={Search}
          title="No approved records match."
          description={`Nothing in the sample library matches “${query.trim()}”. Try a broader term such as “pilot” or “review”.`}
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuery("")}
            >
              Clear search
            </Button>
          }
        />
      )}

      <p className="mt-4 text-[10.5px] leading-5 text-ink/70">
        Only approved meeting records appear. Drafts remain separate.
      </p>
    </div>
  );
}

function DemoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="preview-card border border-ink/15 bg-background shadow-1">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/10 bg-stone/35 px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-7 place-items-center border border-forest/30">
            <span className="font-heading text-[11px] text-forest">N</span>
          </span>
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.06em] text-ink/70 uppercase">
              Harbour proposal
            </p>
            <p className="text-[9.5px] text-ink/70">Preview workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline">Sample data</Badge>
          <span className="hidden text-[9px] tracking-[0.1em] text-ink/70 uppercase sm:inline">
            No live processing
          </span>
        </div>
      </div>

      <Tabs defaultValue="refinement">
        <TabsList
          variant="line"
          className="flex-wrap px-2 sm:px-4"
          aria-label="Product previews"
        >
          <TabsTrigger value="refinement">
            <PenLine aria-hidden="true" />
            Refinement
          </TabsTrigger>
          <TabsTrigger value="preparation">
            <Users aria-hidden="true" />
            Preparation
          </TabsTrigger>
          <TabsTrigger value="summary">
            <FileText aria-hidden="true" />
            Summary
          </TabsTrigger>
          <TabsTrigger value="document">
            <BookOpen aria-hidden="true" />
            Document
          </TabsTrigger>
          <TabsTrigger value="knowledge">
            <Search aria-hidden="true" />
            Knowledge
          </TabsTrigger>
        </TabsList>

        <TabsContent value="refinement" className="p-4 sm:p-6">
          <RefinementDemo />
        </TabsContent>
        <TabsContent value="preparation" className="p-4 sm:p-6">
          <PreparationDemo />
        </TabsContent>
        <TabsContent value="summary" className="p-4 sm:p-6">
          <SummaryTab />
        </TabsContent>
        <TabsContent value="document" className="p-4 sm:p-6">
          <DocumentTab />
        </TabsContent>
        <TabsContent value="knowledge" className="p-4 sm:p-6">
          <KnowledgeTab />
        </TabsContent>
      </Tabs>

      <div className="border-t border-ink/10 bg-stone/25 px-4 py-3 text-[10px] leading-4 text-ink/70 sm:px-5">
        {children}
      </div>
    </div>
  );
}

export function ProductDemo() {
  return (
    <section
      id="product"
      className="section-shell tone-navy border-t border-ink/10"
    >
      <div className="mx-auto w-full max-w-[1120px] px-6 py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-16">
          <SectionHeading
            eyebrow="Inside the product"
            title={
              <>
                See how the work{" "}
                <em className="drift-word text-gold italic">holds</em> together.
              </>
            }
            lead="Five sample views of the product surface, from a draft in review to an approved record you can search."
          />
          <div
            data-reveal
            data-reveal-delay="0.1"
            className="border-l-2 border-gold pl-4 lg:justify-self-end lg:pb-1"
          >
            <p className="text-[10px] font-semibold tracking-[0.12em] text-ink/70 uppercase">
              Preview mode
            </p>
            <p className="mt-2 max-w-xs text-[12px] leading-5 text-ink/70">
              Nothing here connects to an account, a file store, or a live
              model. Search runs locally over sample records.
            </p>
          </div>
        </div>

        <div data-reveal className="mt-12">
          <DemoFrame>
            Interface previews use sample project data. Approval, saving, and
            generation are not available on this site.
          </DemoFrame>
        </div>

        <div
          data-reveal-stagger
          className="mt-6 grid gap-4 border-t border-ink/10 pt-5 text-[11.5px] leading-5 text-ink/70 sm:grid-cols-3"
        >
          <p>
            <span className="font-semibold text-ink/70">Refinement:</span>{" "}
            original text and intention stay visible.
          </p>
          <p>
            <span className="font-semibold text-ink/70">Records:</span>{" "}
            owners and deadlines are never invented.
          </p>
          <p>
            <span className="font-semibold text-ink/70">Knowledge:</span> only
            approved meeting records are searchable.
          </p>
        </div>
      </div>
    </section>
  );
}
