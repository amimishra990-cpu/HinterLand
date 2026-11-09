"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Circle,
  ClipboardList,
  FileSearch,
  FileText,
  Mail,
  NotebookPen,
  PenLine,
  Search,
  Sparkles,
} from "lucide-react";

import { useToast } from "@/components/app/toast";
import {
  Badge,
  buttonClass,
  Card,
  PageHeader,
  SectionHeading,
  StatusBadge,
} from "@/components/app/ui";
import { useWorkspace } from "@/components/app/workspace-provider";

const QUICK_ACTIONS = [
  {
    label: "Refine a message",
    description: "Keep the intent, improve the clarity.",
    href: "/app/communication",
    icon: Mail,
    tone: "forest" as const,
  },
  {
    label: "Prepare for a meeting",
    description: "Turn an agenda into a working brief.",
    href: "/app/preparation",
    icon: ClipboardList,
    tone: "gold" as const,
  },
  {
    label: "Analyze a document",
    description: "Open the library and add a source.",
    href: "/app/projects?tab=documents&action=upload",
    icon: FileSearch,
    tone: "navy" as const,
  },
  {
    label: "Create meeting minutes",
    description: "Structure notes without inventing details.",
    href: "/app/intelligence",
    icon: NotebookPen,
    tone: "burgundy" as const,
  },
  {
    label: "Search previous knowledge",
    description: "Find an approved decision or record.",
    href: "/app/knowledge?focus=search",
    icon: Search,
    tone: "forest" as const,
  },
];

function EmptyNote({
  children,
  href,
  label,
}: {
  children: ReactNode;
  href: string;
  label: string;
}) {
  return (
    <div
      className="mt-3 rounded-md border border-dashed px-3.5 py-4"
      style={{ borderColor: "var(--app-line-strong)" }}
    >
      <p className="text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
        {children}
      </p>
      <Link
        href={href}
        className="mt-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium"
        style={{ color: "var(--app-forest)" }}
      >
        {label}
        <ArrowRight size={12} aria-hidden="true" />
      </Link>
    </div>
  );
}

const toneClasses = {
  forest: { background: "var(--app-forest-soft)", color: "var(--app-forest)" },
  gold: { background: "var(--app-gold-soft)", color: "#7a5a1d" },
  navy: { background: "var(--app-navy-soft)", color: "var(--app-navy)" },
  burgundy: { background: "var(--app-burgundy-soft)", color: "var(--app-burgundy)" },
};

export default function OverviewPage() {
  const toast = useToast();
  const { data, toggleAction } = useWorkspace();
  const { projects, documents, meetings, knowledge, actions } = data;

  const markAction = async (id: string) => {
    const item = actions.find((entry) => entry.id === id);
    if (!item) return;
    const result = await toggleAction(id, !item.done);
    if (!result.ok) {
      toast(result.error ?? "The action could not be updated.", "error");
      return;
    }
    toast(item.done ? "Action moved back to open." : "Action marked complete.", "success");
  };

  const recentSummaries = knowledge
    .filter(
      (record) => record.type === "Meeting record" || record.type === "Decision log"
    )
    .slice(0, 2);

  const activeProjects = projects.filter((project) => !project.archived);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Welcome back."
        description="Here is the context that needs your judgment today, saved to your private workspace."
        actions={
          <>
            <Link href="/app/communication" className={buttonClass("secondary")}>
              <PenLine size={14} aria-hidden="true" />
              Refine a message
            </Link>
            <Link href="/app/preparation" className={buttonClass("primary")}>
              <ClipboardList size={14} aria-hidden="true" />
              Prepare for a meeting
            </Link>
          </>
        }
      />

      <section aria-labelledby="quick-actions">
        <div className="mb-3 flex items-center gap-2">
          <h2 id="quick-actions" className="app-eyebrow">
            Quick actions
          </h2>
          <span className="text-[11px]" style={{ color: "var(--app-muted)" }}>
            Start with your own text
          </span>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            const tone = toneClasses[action.tone];
            return (
              <Link
                key={action.label}
                href={action.href}
                className="app-card group flex items-start gap-3 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: tone.background, color: tone.color }}
                >
                  <Icon size={15} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[12.5px] leading-4 font-semibold">
                    {action.label}
                  </span>
                  <span
                    className="mt-1 block text-[11px] leading-4"
                    style={{ color: "var(--app-muted)" }}
                  >
                    {action.description}
                  </span>
                </span>
                <ArrowRight
                  size={13}
                  className="mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  style={{ color: "var(--app-gold)" }}
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="mt-6 grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-8">
          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Recent projects"
              description="The context each piece of work draws from."
              action={
                <Link href="/app/projects" className="text-[11.5px] font-medium" style={{ color: "var(--app-forest)" }}>
                  View all
                </Link>
              }
            />
            {activeProjects.length === 0 ? (
              <EmptyNote href="/app/projects" label="Create a project">
                No projects yet. A project holds the sources and records for one piece of
                work.
              </EmptyNote>
            ) : (
            <ul className="mt-3 divide-y" style={{ borderColor: "var(--app-line)" }}>
              {activeProjects.map((project) => (
                <li key={project.id} style={{ borderColor: "var(--app-line)" }}>
                  <Link
                    href={`/app/projects?project=${project.id}`}
                    className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-heading text-[16px] leading-snug">{project.name}</span>
                        <StatusBadge status={project.status} />
                      </div>
                      <p className="mt-1 line-clamp-1 text-[12px]" style={{ color: "var(--app-muted)" }}>
                        {project.objective}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3 text-[11px]" style={{ color: "var(--app-muted)" }}>
                      <span>{project.documents.length} documents</span>
                      <span>Updated {project.updated}</span>
                      <ArrowRight size={13} aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-5" id="actions">
            <SectionHeading
              title="Pending action items"
              description="Owners and deadlines appear only when stated in the source material."
              action={
                <Badge tone="terracotta">
                  {actions.filter((item) => !item.done).length} open
                </Badge>
              }
            />
            {actions.length === 0 ? (
              <EmptyNote href="/app/intelligence" label="Create meeting minutes">
                No action items yet. Action items appear here once you extract them from
                meeting notes.
              </EmptyNote>
            ) : (
            <ul className="mt-3 space-y-1.5">
              {actions.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-black/[0.02]"
                >
                  <button
                    type="button"
                    onClick={() => void markAction(item.id)}
                    className="mt-0.5 shrink-0"
                    aria-label={item.done ? `Reopen ${item.label}` : `Complete ${item.label}`}
                    aria-pressed={item.done}
                  >
                    {item.done ? (
                      <CheckCircle2 size={17} style={{ color: "var(--app-forest)" }} aria-hidden="true" />
                    ) : (
                      <Circle size={17} style={{ color: "var(--app-line-strong)" }} aria-hidden="true" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[12.5px] leading-5"
                      style={{
                        color: item.done ? "var(--app-muted)" : "var(--app-ink)",
                        textDecoration: item.done ? "line-through" : "none",
                      }}
                    >
                      {item.label}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                      <span>{item.project}</span>
                      <span>Owner: {item.owner ?? "Not specified"}</span>
                      <span>Due: {item.due ?? "Not specified"}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Recent meeting summaries"
              description="Approved records available in the knowledge repository."
              action={
                <Link href="/app/knowledge" className="text-[11.5px] font-medium" style={{ color: "var(--app-forest)" }}>
                  Knowledge
                </Link>
              }
            />
            {recentSummaries.length === 0 ? (
              <EmptyNote href="/app/intelligence" label="Structure meeting notes">
                No approved records yet. Approved meeting records and decision logs appear
                here.
              </EmptyNote>
            ) : (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {recentSummaries.map((record) => (
                <Link
                  key={record.id}
                  href={`/app/knowledge?record=${record.id}`}
                  className="app-card-soft block p-3 transition-colors hover:border-[color:var(--app-gold)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={record.type === "Meeting record" ? "forest" : "gold"}>
                      {record.type}
                    </Badge>
                    <span className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                      {record.date}
                    </span>
                  </div>
                  <p className="mt-2 font-heading text-[15px] leading-snug">{record.title}</p>
                  <p className="mt-1 line-clamp-2 text-[11.5px] leading-4" style={{ color: "var(--app-muted)" }}>
                    {record.description}
                  </p>
                </Link>
              ))}
            </div>
            )}
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-4">
          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Upcoming meetings"
              action={
                <Link href="/app/preparation" className="text-[11.5px] font-medium" style={{ color: "var(--app-forest)" }}>
                  Prepare
                </Link>
              }
            />
            {meetings.length === 0 ? (
              <EmptyNote href="/app/preparation" label="Prepare a meeting">
                No meetings scheduled. Create a meeting to build a working brief from its
                agenda.
              </EmptyNote>
            ) : (
            <ul className="mt-3 space-y-2.5">
              {meetings.slice(0, 3).map((meeting) => (
                <li key={meeting.id} className="flex gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-md"
                    style={{ backgroundColor: "var(--app-panel-strong)" }}
                    aria-hidden="true"
                  >
                    <CalendarDays size={14} style={{ color: "var(--app-forest)" }} />
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/app/preparation?meeting=${meeting.id}`}
                      className="block text-[12.5px] leading-4 font-medium hover:underline"
                    >
                      {meeting.title}
                    </Link>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--app-muted)" }}>
                      {meeting.date} · {meeting.time}
                    </p>
                    <p className="mt-0.5 text-[11px]" style={{ color: "var(--app-muted)" }}>
                      {meeting.project}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Recent documents"
              action={
                <Link href="/app/projects?tab=documents" className="text-[11.5px] font-medium" style={{ color: "var(--app-forest)" }}>
                  Library
                </Link>
              }
            />
            {documents.length === 0 ? (
              <EmptyNote href="/app/projects?tab=documents&action=upload" label="Add a document">
                No documents yet. Upload a file or paste text to build your source library.
              </EmptyNote>
            ) : (
            <ul className="mt-3 divide-y" style={{ borderColor: "var(--app-line)" }}>
              {documents.slice(0, 4).map((doc) => (
                <li key={doc.id} style={{ borderColor: "var(--app-line)" }}>
                  <Link
                    href={`/app/projects?tab=documents&doc=${doc.id}`}
                    className="flex items-center gap-2.5 py-2 first:pt-0 last:pb-0"
                  >
                    <FileText size={14} style={{ color: "var(--app-gold)" }} aria-hidden="true" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12px] font-medium">{doc.name}</span>
                      <span className="block text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                        {doc.project} · {doc.uploaded}
                      </span>
                    </span>
                    <Badge tone="neutral">{doc.type}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
            )}
          </Card>

          <Card soft className="p-4">
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: "var(--app-gold)" }} aria-hidden="true" />
              <p className="text-[12px] font-semibold">Private by default</p>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
              Your records are stored in your account and isolated with row-level security.
              Extracted document text stays with the document, and approvals are saved to the
              database.
            </p>
            <Link
              href="/app/help"
              className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-medium"
              style={{ color: "var(--app-forest)" }}
            >
              How your workspace works
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </Card>
        </div>
      </div>
    </>
  );
}
