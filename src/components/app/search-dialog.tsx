"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  FileText,
  FolderOpen,
  ListTodo,
  Search,
  X,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/app/ui";
import { useWorkspace } from "@/components/app/workspace-provider";
import type { WorkspaceData } from "@/lib/workspace-types";

type Result = {
  id: string;
  title: string;
  subtitle: string;
  kind: string;
  href: string;
  icon: LucideIcon;
};

function buildIndex(data: WorkspaceData): Result[] {
  const results: Result[] = [];

  for (const project of data.projects) {
    results.push({
      id: `project-${project.id}`,
      title: project.name,
      subtitle: `${project.status} · ${project.objective}`,
      kind: "Project",
      href: `/app/projects?project=${project.id}`,
      icon: FolderOpen,
    });
  }

  for (const doc of data.documents) {
    results.push({
      id: `doc-${doc.id}`,
      title: doc.name,
      subtitle: `${doc.type} · ${doc.project}`,
      kind: "Document",
      href: `/app/projects?tab=documents&doc=${doc.id}`,
      icon: FileText,
    });
  }

  for (const meeting of data.meetings) {
    results.push({
      id: `meeting-${meeting.id}`,
      title: meeting.title,
      subtitle: `${meeting.date} · ${meeting.project}`,
      kind: "Meeting",
      href: `/app/preparation?meeting=${meeting.id}`,
      icon: ClipboardList,
    });
  }

  for (const record of data.knowledge) {
    results.push({
      id: `record-${record.id}`,
      title: record.title,
      subtitle: `${record.type} · ${record.project}`,
      kind: "Knowledge",
      href: `/app/knowledge?record=${record.id}`,
      icon: BookOpen,
    });
  }

  for (const action of data.actions) {
    results.push({
      id: `action-${action.id}`,
      title: action.label,
      subtitle: `${action.project} · ${action.owner ?? "Owner not specified"}`,
      kind: "Action",
      href: "/app#actions",
      icon: ListTodo,
    });
  }

  return results;
}

export function SearchDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data } = useWorkspace();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const index = useMemo(() => buildIndex(data), [data]);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return index.slice(0, 8);
    return index
      .filter((item) =>
        `${item.title} ${item.subtitle} ${item.kind}`.toLowerCase().includes(term)
      )
      .slice(0, 12);
  }, [index, query]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const go = (result: Result) => {
    onClose();
    router.push(result.href);
  };

  return (
    <div
      className="fixed inset-0 z-[85] flex items-start justify-center px-4 pt-[10vh]"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(20, 30, 24, 0.42)" }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search workspace"
        className="app-dialog relative w-full max-w-[600px] overflow-hidden rounded-xl"
        style={{
          backgroundColor: "var(--app-panel)",
          border: "1px solid var(--app-line)",
          boxShadow: "0 30px 80px -30px rgba(20,30,24,.55)",
        }}
      >
        <div
          className="flex items-center gap-3 border-b px-4"
          style={{ borderColor: "var(--app-line)" }}
        >
          <Search size={17} style={{ color: "var(--app-muted)" }} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((current) => Math.min(current + 1, results.length - 1));
              }
              if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((current) => Math.max(current - 1, 0));
              }
              if (event.key === "Enter" && results[active]) {
                event.preventDefault();
                go(results[active]);
              }
            }}
            placeholder="Search projects, documents, meetings, records, actions…"
            aria-label="Search workspace"
            className="h-12 min-w-0 flex-1 bg-transparent text-[14px] outline-none"
            style={{ color: "var(--app-ink)" }}
          />
          <button
            type="button"
            onClick={onClose}
            className="app-icon-btn shrink-0"
            aria-label="Close search"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        <div className="app-scroll max-h-[54vh] overflow-y-auto p-2">
          {results.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="font-heading text-[16px]">No local matches</p>
              <p className="mt-1 text-[12.5px]" style={{ color: "var(--app-muted)" }}>
                Try a project name, document title, or decision topic.
              </p>
            </div>
          ) : (
            <ul>
              {results.map((result, indexPosition) => {
                const Icon = result.icon;
                return (
                  <li key={result.id}>
                    <button
                      type="button"
                      onMouseEnter={() => setActive(indexPosition)}
                      onClick={() => go(result)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors"
                      style={{
                        backgroundColor:
                          active === indexPosition ? "var(--app-panel-strong)" : "transparent",
                      }}
                    >
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                        style={{
                          backgroundColor: "var(--app-forest-soft)",
                          color: "var(--app-forest)",
                        }}
                      >
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium">
                          {result.title}
                        </span>
                        <span
                          className="block truncate text-[11.5px]"
                          style={{ color: "var(--app-muted)" }}
                        >
                          {result.subtitle}
                        </span>
                      </span>
                      <Badge tone="neutral">{result.kind}</Badge>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div
          className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-[11px]"
          style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
        >
          <span>Searches your account data</span>
          <span className="flex items-center gap-1">
            <span className="app-kbd">↑</span>
            <span className="app-kbd">↓</span>
            <span className="app-kbd">↵</span>
            to open
          </span>
        </div>
      </div>
    </div>
  );
}
