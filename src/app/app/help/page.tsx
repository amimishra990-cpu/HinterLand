import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  ClipboardList,
  FolderOpen,
  Keyboard,
  NotebookPen,
  PenLine,
  Search,
  ShieldCheck,
  Sprout,
} from "lucide-react";

import { Badge, PageHeader } from "@/components/app/ui";

export const instant = false;

export const metadata: Metadata = {
  title: "Help",
  description: "How the Hinterland workspace behaves and where to find each tool.",
};

const TOOLS = [
  {
    href: "/app/communication",
    label: "Communication",
    description: "Refine a message and inspect every change.",
    icon: PenLine,
  },
  {
    href: "/app/preparation",
    label: "Meeting Preparation",
    description: "Build a brief from an agenda and source material.",
    icon: ClipboardList,
  },
  {
    href: "/app/intelligence",
    label: "Meeting Intelligence",
    description: "Structure notes, then edit, approve, save, or export.",
    icon: NotebookPen,
  },
  {
    href: "/app/projects",
    label: "Projects & Documents",
    description: "Project context, document previews, and analysis.",
    icon: FolderOpen,
  },
  {
    href: "/app/knowledge",
    label: "Knowledge Repository",
    description: "Search approved records by project, topic, and date.",
    icon: BookOpen,
  },
  {
    href: "/app/development",
    label: "My Development",
    description: "Tone, structure, approved examples, and feedback.",
    icon: Sprout,
  },
];

const SHORTCUTS = [
  { keys: ["Ctrl", "K"], action: "Open workspace search" },
  { keys: ["↑", "↓"], action: "Move through search results" },
  { keys: ["Enter"], action: "Open the highlighted result" },
  { keys: ["Esc"], action: "Close search, menus, or a dialog" },
  { keys: ["Tab"], action: "Move through form fields and controls" },
];

const FAQS = [
  {
    question: "Is this connected to a real account?",
    answer:
      "Yes. You sign in with a verified email and password. Your profile, projects, documents, meetings, records, and writing preferences are stored in your Supabase account and are only readable by you.",
  },
  {
    question: "Does Hinterland call an AI model here?",
    answer:
      "No. Refinement and extraction use a fixed set of writing rules. They can remove hedging and recognise explicit decisions, but they cannot verify facts or invent context. The product interface is designed to show its uncertainty rather than hide it.",
  },
  {
    question: "Where does my text go?",
    answer:
      "Workspace records are written to your Supabase database. Uploaded PDF and DOCX originals go to a private storage bucket, and extracted text is saved with the document record. Nothing is shared with other users, and no third-party model receives it.",
  },
  {
    question: "Why do owners and deadlines say “Not specified”?",
    answer:
      "Because the source material did not state them. The workspace never fills a missing owner or deadline by guessing. If the notes name a person or a date, the record shows it; otherwise it stays open.",
  },
  {
    question: "How do I save a meeting record?",
    answer:
      "Review the draft, edit anything that needs correction, then approve it. Saving, copying, and exporting stay disabled until you approve. This protects you from storing or sharing a record you have not checked.",
  },
  {
    question: "What happens to an uploaded document?",
    answer:
      "The PDF or DOCX is validated, its text is extracted in your browser, and the original file is uploaded to private storage under your user id. The extracted text, analysis summary, size, and page count are saved with the document record. You can download the original through a short-lived signed link or delete both the record and the stored file.",
  },
  {
    question: "Can another person see what is saved here?",
    answer:
      "No. Every table and storage object is protected by row-level security tied to your authenticated user id. Another signed-in user cannot read, update, or delete your records.",
  },
  {
    question: "What happens when I reset the workspace?",
    answer:
      "Settings → Reset workspace deletes your projects, documents, meetings, records, writing examples, and stored files, leaving an empty workspace. Your login and profile are kept. Delete account removes the login too.",
  },
];

export default function HelpPage() {
  return (
    <>
      <PageHeader
        eyebrow="Help"
        title="How this workspace behaves"
        description="A short guide to the workspace, including what is stored, what is rule-based, and where each tool lives."
        actions={
          <>
            <Badge tone="forest">Private to you</Badge>
            <Link href="/app" className="app-btn app-btn-secondary app-btn-sm">
              Back to overview
            </Link>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-7">
          <section aria-labelledby="tools-heading">
            <h2 id="tools-heading" className="app-eyebrow">
              Workspace tools
            </h2>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {TOOLS.map((tool) => {
                const Icon = tool.icon;
                return (
                  <Link
                    key={tool.href}
                    href={tool.href}
                    className="app-card group flex items-start gap-3 p-3.5 transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                      style={{ backgroundColor: "var(--app-forest-soft)", color: "var(--app-forest)" }}
                    >
                      <Icon size={15} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12.5px] font-semibold">{tool.label}</span>
                      <span className="mt-0.5 block text-[11px] leading-4" style={{ color: "var(--app-muted)" }}>
                        {tool.description}
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

          <section aria-labelledby="faq-heading">
            <h2 id="faq-heading" className="app-eyebrow">
              Common questions
            </h2>
            <div className="mt-2 space-y-2">
              {FAQS.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-lg border px-0"
                  style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel)" }}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <span className="text-[12.5px] font-semibold">{faq.question}</span>
                    <ChevronRight
                      size={14}
                      className="shrink-0 transition-transform group-open:rotate-90"
                      style={{ color: "var(--app-muted)" }}
                      aria-hidden="true"
                    />
                  </summary>
                  <p
                    className="px-4 pb-3.5 text-[12px] leading-5"
                    style={{ color: "var(--app-ink-soft)" }}
                  >
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-4 xl:col-span-5">
          <section
            id="data"
            className="app-card p-4 sm:p-5"
            aria-labelledby="data-heading"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: "var(--app-forest)" }} aria-hidden="true" />
              <h2 id="data-heading" className="font-heading text-[18px]">
                How your data is handled
              </h2>
            </div>
            <ul className="mt-3 space-y-2.5">
              {[
                {
                  label: "Account-owned records",
                  detail:
                    "Projects, documents, meetings, preparations, records, decisions, actions, knowledge entries, and writing preferences are stored per user in Postgres.",
                },
                {
                  label: "Row-level security",
                  detail:
                    "Policies on every table and storage object require auth.uid() to match the row owner. Signed-in users cannot reach another account's data.",
                },
                {
                  label: "Private documents",
                  detail:
                    "The documents bucket is private. Uploads are validated for type and size, stored under your user folder, and downloaded through 60-second signed URLs.",
                },
                {
                  label: "Rule-based logic",
                  detail:
                    "Refinement and extraction run in your browser or in fixed server rules. No language model is called.",
                },
                {
                  label: "No automatic learning",
                  detail:
                    "My Development follows preferences and examples you approve on that page. Nothing is trained in the background.",
                },
              ].map((item) => (
                <li key={item.label} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--app-gold)" }}
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block text-[12px] font-semibold">{item.label}</span>
                    <span className="mt-0.5 block text-[11px] leading-4" style={{ color: "var(--app-muted)" }}>
                      {item.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="app-card p-4 sm:p-5" aria-labelledby="shortcuts-heading">
            <div className="flex items-center gap-2">
              <Keyboard size={15} style={{ color: "var(--app-gold)" }} aria-hidden="true" />
              <h2 id="shortcuts-heading" className="font-heading text-[18px]">
                Keyboard shortcuts
              </h2>
            </div>
            <ul className="mt-3 space-y-2">
              {SHORTCUTS.map((shortcut) => (
                <li
                  key={shortcut.action}
                  className="flex items-center justify-between gap-3 border-b py-1.5 last:border-b-0"
                  style={{ borderColor: "var(--app-line)" }}
                >
                  <span className="text-[11.5px]" style={{ color: "var(--app-ink-soft)" }}>
                    {shortcut.action}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    {shortcut.keys.map((key) => (
                      <span key={key} className="app-kbd">
                        {key}
                      </span>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
              On macOS, use ⌘ K instead of Ctrl K.
            </p>
          </section>

          <section
            className="rounded-lg border p-4 sm:p-5"
            style={{ borderColor: "rgba(156,120,51,.28)", backgroundColor: "var(--app-gold-soft)" }}
            aria-labelledby="start-heading"
          >
            <div className="flex items-center gap-2">
              <Search size={15} style={{ color: "#77591f" }} aria-hidden="true" />
              <h2 id="start-heading" className="font-heading text-[17px]" style={{ color: "#5f4a1d" }}>
                Start with one task
              </h2>
            </div>
            <p className="mt-1.5 text-[11.5px] leading-5" style={{ color: "#6f5420" }}>
              Each quick action opens a real workspace flow. Nothing is saved until you review and approve it.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href="/app/communication" className="app-btn app-btn-secondary app-btn-sm">
                Refine a message
              </Link>
              <Link href="/app/intelligence" className="app-btn app-btn-secondary app-btn-sm">
                Structure notes
              </Link>
              <Link href="/app/knowledge" className="app-btn app-btn-secondary app-btn-sm">
                Search knowledge
              </Link>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge tone="gold">No model called</Badge>
              <Badge tone="forest">Stored in your account</Badge>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
