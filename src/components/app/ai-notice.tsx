"use client";

import { Files, Sparkles } from "lucide-react";

import type { AiContextSummary, AiMeta } from "@/lib/ai-client";

export function AiContextNote({ context }: { context: AiContextSummary | null }) {
  if (!context) return null;
  const sources = context.sources.filter((source) => source.kind !== "action");
  if (sources.length === 0 && context.omitted.length === 0) {
    return (
      <p className="mt-2 flex items-start gap-1.5 text-[10.5px] leading-4" style={{ color: "var(--app-muted)" }}>
        <Files size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
        No project sources were selected. The result uses only the text you supplied.
      </p>
    );
  }

  return (
    <div className="mt-2 text-[10.5px] leading-4" style={{ color: "var(--app-muted)" }}>
      <p className="flex items-start gap-1.5">
        <Files size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          <span className="font-semibold">Sources used: </span>
          {sources.length > 0 ? sources.map((source) => source.label).join(", ") : "None"}
          {context.sources.some((source) => source.kind === "action")
            ? ", open action items"
            : ""}
        </span>
      </p>
      {context.omitted.map((note) => (
        <p key={note} className="mt-1 pl-[18px]">
          {note}
        </p>
      ))}
      {context.truncated ? (
        <p className="mt-1 pl-[18px] font-semibold" style={{ color: "#8c4a2f" }}>
          Context was truncated to fit the request budget. Some source material was not sent.
        </p>
      ) : null}
    </div>
  );
}

export function AiMetaNote({ meta }: { meta: AiMeta | null }) {
  if (!meta) return null;
  return (
    <span className="inline-flex items-center gap-1.5">
      <Sparkles size={12} aria-hidden="true" />
      {meta.provider} · {meta.model}
      {meta.cached ? " · cached result" : ""}
    </span>
  );
}
