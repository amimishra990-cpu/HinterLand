import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export type ContextSourceKind =
  | "project"
  | "document"
  | "knowledge"
  | "meeting"
  | "action";

export type ContextSource = {
  id: string;
  kind: ContextSourceKind;
  label: string;
  chars: number;
  truncated: boolean;
};

export type ContextPacket = {
  text: string;
  sources: ContextSource[];
  omitted: string[];
  truncated: boolean;
  estimatedTokens: number;
  documentTexts: Record<string, { name: string; text: string }>;
  sourceTexts: string[];
};

export type ContextOptions = {
  projectId?: string | null;
  documentIds?: string[];
  knowledgeIds?: string[];
  includeRecentKnowledge?: boolean;
  includeMeetings?: boolean;
  includeActions?: boolean;
  budgetChars?: number;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  objective: string;
  status: string;
};

type DocumentRow = {
  id: string;
  name: string;
  file_type: string;
  page_count: number | null;
  excerpt: string;
  extracted_text: string | null;
  project_id: string | null;
  extraction_method: string | null;
  extraction_confidence: number | string | null;
};

const OCR_METHODS = new Set(["ocr", "mixed", "image"]);

function extractionNote(document: DocumentRow) {
  const method = document.extraction_method;
  if (!method) return "";
  if (method === "docx") return "[Extraction: DOCX text layer.]\n";
  if (!OCR_METHODS.has(method)) return "";
  const raw = document.extraction_confidence;
  const confidence = raw === null || raw === undefined ? null : Number(raw);
  const percent =
    confidence !== null && Number.isFinite(confidence)
      ? `, average confidence ${Math.round(confidence * 100)}%`
      : "";
  return `[Extraction: OCR${percent}. OCR text can contain recognition errors; do not treat uncertain wording as verified.]\n`;
}

export type KnowledgeRow = {
  id: string;
  title: string;
  kind: string;
  topic: string;
  description: string;
  content: string[];
  entry_date: string;
  project_id: string | null;
};

type MeetingRow = {
  id: string;
  title: string;
  objective: string;
  attendees: string[];
  scheduled_start: string | null;
};

type ActionRow = {
  id: string;
  label: string;
  owner: string | null;
  due_date: string | null;
  done: boolean;
};

function budgetFromEnv() {
  const raw = Number.parseInt(process.env.AI_CONTEXT_CHARS ?? "", 10);
  if (!Number.isFinite(raw)) return 24_000;
  return Math.min(120_000, Math.max(4_000, raw));
}

function safeBody(text: string) {
  return text
    .replace(/\[(END )?(DOCUMENT|RECORD|MEETING|PROJECT|ACTIONS)\b/gi, "($1$2")
    .replace(/\u0000/g, "");
}

export async function loadAuthorizedProject(
  supabase: SupabaseClient,
  userId: string,
  projectId: string
): Promise<ProjectRow | null> {
  const { data } = await supabase
    .from("projects")
    .select("id, name, description, objective, status")
    .eq("id", projectId)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as ProjectRow | null) ?? null;
}

export async function loadAuthorizedDocuments(
  supabase: SupabaseClient,
  userId: string,
  documentIds: string[]
): Promise<{ documents: DocumentRow[]; missingIds: string[] }> {
  const unique = Array.from(new Set(documentIds.filter(Boolean))).slice(0, 12);
  if (unique.length === 0) return { documents: [], missingIds: [] };
  const { data } = await supabase
    .from("documents")
    .select(
      "id, name, file_type, page_count, excerpt, extracted_text, project_id, extraction_method, extraction_confidence"
    )
    .eq("user_id", userId)
    .in("id", unique);
  const documents = (data ?? []) as DocumentRow[];
  const found = new Set(documents.map((doc) => doc.id));
  return { documents, missingIds: unique.filter((id) => !found.has(id)) };
}

export async function loadApprovedKnowledge(
  supabase: SupabaseClient,
  userId: string,
  options: { projectId?: string | null; knowledgeIds?: string[]; limit?: number }
): Promise<{ records: KnowledgeRow[]; missingIds: string[] }> {
  let query = supabase
    .from("knowledge_entries")
    .select("id, title, kind, topic, description, content, entry_date, project_id")
    .eq("user_id", userId)
    .eq("approved", true);

  if (options.knowledgeIds && options.knowledgeIds.length > 0) {
    const unique = Array.from(new Set(options.knowledgeIds.filter(Boolean))).slice(0, 20);
    const { data } = await query.in("id", unique);
    const records = (data ?? []) as KnowledgeRow[];
    const found = new Set(records.map((record) => record.id));
    return { records, missingIds: unique.filter((id) => !found.has(id)) };
  }

  if (options.projectId) query = query.eq("project_id", options.projectId);
  const { data } = await query
    .order("entry_date", { ascending: false })
    .limit(Math.min(40, Math.max(1, options.limit ?? 20)));
  return { records: (data ?? []) as KnowledgeRow[], missingIds: [] };
}

export function knowledgeToText(record: KnowledgeRow) {
  return [
    record.title,
    `${record.kind} · ${record.topic || "No topic"} · ${record.entry_date}`,
    record.description,
    ...record.content,
  ]
    .filter(Boolean)
    .join("\n");
}

export function documentText(document: DocumentRow) {
  return (document.extracted_text ?? "").trim() || (document.excerpt ?? "").trim();
}

export async function assembleContext(
  supabase: SupabaseClient,
  userId: string,
  options: ContextOptions
): Promise<ContextPacket> {
  const budget = Math.min(120_000, Math.max(4_000, options.budgetChars ?? budgetFromEnv()));
  const blocks: { header: string; body: string; source: ContextSource }[] = [];
  const omitted: string[] = [];
  const documentTexts: Record<string, { name: string; text: string }> = {};
  const sourceTexts: string[] = [];

  if (options.projectId) {
    const project = await loadAuthorizedProject(supabase, userId, options.projectId);
    if (!project) {
      throw new ContextAccessError("Choose a project that belongs to your account.");
    }
    const body = safeBody(
      [
        `Name: ${project.name}`,
        `Status: ${project.status}`,
        project.objective ? `Objective: ${project.objective}` : "",
        project.description ? `Description: ${project.description}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
    blocks.push({
      header: `[PROJECT id="${project.id}"]`,
      body,
      source: {
        id: project.id,
        kind: "project",
        label: project.name,
        chars: body.length,
        truncated: false,
      },
    });
    sourceTexts.push(body);
  }

  if (options.documentIds && options.documentIds.length > 0) {
    const { documents, missingIds } = await loadAuthorizedDocuments(
      supabase,
      userId,
      options.documentIds
    );
    if (missingIds.length > 0) {
      throw new ContextAccessError("One or more selected documents were not found in your library.");
    }
    for (const document of documents) {
      const full = documentText(document);
      if (!full) {
        omitted.push(`${document.name} has no extractable text and was not sent.`);
        continue;
      }
      const cap = Math.min(14_000, Math.max(2_000, Math.floor(budget / 3)));
      const body = safeBody(`${extractionNote(document)}${full.slice(0, cap)}`);
      const truncated = full.length > cap;
      documentTexts[document.id] = { name: document.name, text: full };
      sourceTexts.push(full);
      blocks.push({
        header: `[DOCUMENT id="${document.id}" name="${document.name}" type="${document.file_type}"]`,
        body: truncated ? `${body}\n\n[Document text truncated at ${cap} characters for this request.]` : body,
        source: {
          id: document.id,
          kind: "document",
          label: document.name,
          chars: body.length,
          truncated,
        },
      });
      if (truncated) {
        omitted.push(`${document.name} was truncated to ${cap.toLocaleString("en-US")} characters.`);
      }
    }
  }

  if (options.knowledgeIds && options.knowledgeIds.length > 0) {
    const { records, missingIds } = await loadApprovedKnowledge(supabase, userId, {
      knowledgeIds: options.knowledgeIds,
    });
    if (missingIds.length > 0) {
      throw new ContextAccessError(
        "One or more selected knowledge records are missing or not approved."
      );
    }
    for (const record of records) {
      const full = knowledgeToText(record);
      const body = safeBody(full.slice(0, 4_000));
      sourceTexts.push(full);
      blocks.push({
        header: `[RECORD id="${record.id}" kind="${record.kind}" date="${record.entry_date}"]`,
        body,
        source: {
          id: record.id,
          kind: "knowledge",
          label: record.title,
          chars: body.length,
          truncated: full.length > 4_000,
        },
      });
    }
  } else if (options.includeRecentKnowledge) {
    const { records } = await loadApprovedKnowledge(supabase, userId, {
      projectId: options.projectId ?? null,
      limit: 12,
    });
    for (const record of records) {
      const full = knowledgeToText(record);
      const body = safeBody(full.slice(0, 3_000));
      sourceTexts.push(full);
      blocks.push({
        header: `[RECORD id="${record.id}" kind="${record.kind}" date="${record.entry_date}"]`,
        body,
        source: {
          id: record.id,
          kind: "knowledge",
          label: record.title,
          chars: body.length,
          truncated: full.length > 3_000,
        },
      });
    }
  }

  if (options.includeMeetings && options.projectId) {
    const { data } = await supabase
      .from("meetings")
      .select("id, title, objective, attendees, scheduled_start")
      .eq("user_id", userId)
      .eq("project_id", options.projectId)
      .order("scheduled_start", { ascending: false })
      .limit(6);
    for (const meeting of (data ?? []) as MeetingRow[]) {
      const body = safeBody(
        [
          `Title: ${meeting.title}`,
          meeting.scheduled_start
            ? `Scheduled: ${new Date(meeting.scheduled_start).toLocaleString("en-US")}`
            : "Scheduled: Not specified",
          meeting.objective ? `Objective: ${meeting.objective}` : "",
          meeting.attendees.length > 0 ? `Attendees listed: ${meeting.attendees.join(", ")}` : "",
        ]
          .filter(Boolean)
          .join("\n")
      );
      blocks.push({
        header: `[MEETING id="${meeting.id}"]`,
        body,
        source: {
          id: meeting.id,
          kind: "meeting",
          label: meeting.title,
          chars: body.length,
          truncated: false,
        },
      });
      sourceTexts.push(body);
    }
  }

  if (options.includeActions && options.projectId) {
    const { data } = await supabase
      .from("action_items")
      .select("id, label, owner, due_date, done")
      .eq("user_id", userId)
      .eq("project_id", options.projectId)
      .eq("done", false)
      .order("created_at", { ascending: false })
      .limit(20);
    const rows = (data ?? []) as ActionRow[];
    if (rows.length > 0) {
      const body = safeBody(
        rows
          .map(
            (action) =>
              `- ${action.label} | Owner: ${action.owner ?? "Not specified"} | Due: ${action.due_date ?? "Not specified"}`
          )
          .join("\n")
      );
      blocks.push({
        header: "[ACTIONS]",
        body,
        source: {
          id: options.projectId,
          kind: "action",
          label: "Open action items",
          chars: body.length,
          truncated: false,
        },
      });
      sourceTexts.push(body);
    }
  }

  const sections: string[] = [];
  const sources: ContextSource[] = [];
  let used = 0;
  let truncated = false;

  for (const block of blocks) {
    const tag = block.header.match(/^\[([A-Z]+)/)?.[1] ?? "SOURCE";
    const rendered = `${block.header}\n${block.body}\n[END ${tag}]`;
    if (used + rendered.length > budget) {
      const remaining = budget - used;
      if (remaining > 600) {
        const cut = block.body.slice(0, remaining - block.header.length - 60);
        const cutAt = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "));
        const piece =
          (cutAt > 200 ? cut.slice(0, cutAt) : cut) + "\n[Truncated to fit the context budget.]";
        sections.push(`${block.header}\n${piece}\n[END ${tag}]`);
        sources.push({
          id: block.source.id,
          kind: block.source.kind,
          label: block.source.label,
          chars: piece.length,
          truncated: true,
        });
        omitted.push(`${block.source.label} was truncated to fit the context budget.`);
      } else {
        omitted.push(`${block.source.label} was left out of the context budget.`);
      }
      truncated = true;
      break;
    }
    sections.push(rendered);
    used += rendered.length;
    sources.push(block.source);
  }

  const text =
    sections.length > 0
      ? sections.join("\n\n")
      : "(No source material was selected. Do not assume any project facts.)";

  return {
    text,
    sources,
    omitted,
    truncated,
    estimatedTokens: Math.ceil(text.length / 4),
    documentTexts,
    sourceTexts,
  };
}

export class ContextAccessError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ContextAccessError";
  }
}
