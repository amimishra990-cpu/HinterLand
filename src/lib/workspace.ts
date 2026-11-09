import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  DEFAULT_WRITING_PREFERENCES,
  isSourceKind,
  type DocumentExtractionMethod,
  type DocumentExtractionQuality,
  type NotificationPreferences,
  type WorkspaceData,
} from "@/lib/workspace-types";

type DB = SupabaseClient;

function toIsoDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function formatDate(value: string | null | undefined, fallback = "Not set") {
  if (!value) return fallback;
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

function formatTime(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(parsed);
}

function formatSize(bytes: number, type: string) {
  if (type === "Notes" || !bytes) return "Pasted note";
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function normaliseAnalysis(value: unknown) {
  if (!value || typeof value !== "object") {
    return { summary: "", findings: [] as string[], gaps: [] as string[] };
  }
  const record = value as Record<string, unknown>;
  return {
    summary: typeof record.summary === "string" ? record.summary : "",
    findings: Array.isArray(record.findings)
      ? record.findings.filter((item): item is string => typeof item === "string")
      : [],
    gaps: Array.isArray(record.gaps)
      ? record.gaps.filter((item): item is string => typeof item === "string")
      : [],
  };
}

const EXTRACTION_METHODS = new Set<DocumentExtractionMethod>([
  "pdf-text",
  "ocr",
  "mixed",
  "docx",
  "image",
  "manual",
]);

function normaliseExtractionQuality(value: unknown): DocumentExtractionQuality | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const count = (key: string) => {
    const number = Number(record[key]);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  };
  const quality: DocumentExtractionQuality = {
    pageCount: count("pageCount"),
    textPages: count("textPages"),
    scannedPages: count("scannedPages"),
    ocrPages: count("ocrPages"),
    lowConfidencePages: count("lowConfidencePages"),
    uncertainPages: count("uncertainPages"),
    duplicatePages: count("duplicatePages"),
    emptyPages: count("emptyPages"),
    repeatedLinesRemoved: count("repeatedLinesRemoved"),
    truncated: Boolean(record.truncated),
    warnings: Array.isArray(record.warnings)
      ? record.warnings.filter((warning): warning is string => typeof warning === "string")
      : [],
  };
  return quality;
}

function normaliseNotifications(value: unknown): NotificationPreferences {
  if (!value || typeof value !== "object") return DEFAULT_NOTIFICATION_PREFERENCES;
  const record = value as Record<string, unknown>;
  return {
    meetingReminders:
      typeof record.meetingReminders === "boolean"
        ? record.meetingReminders
        : DEFAULT_NOTIFICATION_PREFERENCES.meetingReminders,
    approvalRequests:
      typeof record.approvalRequests === "boolean"
        ? record.approvalRequests
        : DEFAULT_NOTIFICATION_PREFERENCES.approvalRequests,
    weeklySummary:
      typeof record.weeklySummary === "boolean"
        ? record.weeklySummary
        : DEFAULT_NOTIFICATION_PREFERENCES.weeklySummary,
  };
}

async function ensureProfile(supabase: DB, user: User) {
  let { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fallbackName =
      (user.user_metadata?.full_name as string | undefined) ??
      user.email?.split("@")[0] ??
      "Member";
    await supabase
      .from("profiles")
      .insert({ id: user.id, full_name: fallbackName })
      .select("*")
      .maybeSingle();
    const retry = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = retry.data;
  }

  return profile;
}

export async function loadWorkspaceData(
  supabase: DB,
  user: User
): Promise<WorkspaceData> {
  const profile = await ensureProfile(supabase, user);

  if (!profile) {
    throw new Error("Could not create the user profile.");
  }

  const [
    projectsResult,
    documentsResult,
    meetingsResult,
    actionsResult,
    decisionsResult,
    knowledgeResult,
    preferencesResult,
    examplesResult,
  ] = await Promise.all([
    supabase.from("projects").select("*").order("updated_at", { ascending: false }),
    supabase.from("documents").select("*").order("uploaded_at", { ascending: false }),
    supabase.from("meetings").select("*").order("scheduled_start", { ascending: true }),
    supabase.from("action_items").select("*").order("created_at", { ascending: true }),
    supabase.from("decisions").select("*").order("decided_at", { ascending: false }),
    supabase.from("knowledge_entries").select("*").order("entry_date", { ascending: false }),
    supabase.from("writing_preferences").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("approved_writing_examples")
      .select("*")
      .order("approved_at", { ascending: false }),
  ]);

  const queryError =
    projectsResult.error ??
    documentsResult.error ??
    meetingsResult.error ??
    actionsResult.error ??
    decisionsResult.error ??
    knowledgeResult.error ??
    preferencesResult.error ??
    examplesResult.error;

  if (queryError) {
    throw new Error(`Workspace data could not be loaded: ${queryError.message}`);
  }

  const projectRows = projectsResult.data ?? [];
  const documentRows = documentsResult.data ?? [];
  const meetingRows = meetingsResult.data ?? [];
  const actionRows = actionsResult.data ?? [];
  const decisionRows = decisionsResult.data ?? [];
  const knowledgeRows = knowledgeResult.data ?? [];
  const preferenceRow = preferencesResult.data;
  const exampleRows = examplesResult.data ?? [];

  const projectNameById = new Map(
    projectRows.map((row) => [row.id as string, row.name as string])
  );
  const meetingTitleById = new Map(
    meetingRows.map((row) => [row.id as string, row.title as string])
  );

  const documents = documentRows.map((row) => {
    const methodRaw = row.extraction_method as string | null;
    const confidenceRaw = row.extraction_confidence;
    const confidence =
      confidenceRaw === null || confidenceRaw === undefined
        ? null
        : Number(confidenceRaw);
    return {
      id: row.id as string,
      name: row.name as string,
      type: row.file_type as "PDF" | "DOCX" | "Notes" | "Image",
      project: projectNameById.get(row.project_id as string) ?? "No project",
      uploaded: formatDate(row.uploaded_at, "Today"),
      size: formatSize(Number(row.size_bytes ?? 0), row.file_type as string),
      status: row.status as "Ready" | "Processing" | "Needs review" | "Failed",
      excerpt: (row.excerpt as string) ?? "",
      extractedText: (row.extracted_text as string | null) ?? undefined,
      pageCount: (row.page_count as number | null) ?? null,
      analysis: normaliseAnalysis(row.analysis),
      projectId: (row.project_id as string | null) ?? null,
      storagePath: (row.storage_path as string | null) ?? null,
      uploadedAt: row.uploaded_at as string,
      sourceKind: isSourceKind(row.source_kind) ? row.source_kind : "Document",
      extractionMethod:
        methodRaw && EXTRACTION_METHODS.has(methodRaw as DocumentExtractionMethod)
          ? (methodRaw as DocumentExtractionMethod)
          : null,
      extractionConfidence:
        confidence !== null && Number.isFinite(confidence)
          ? Math.min(1, Math.max(0, confidence))
          : null,
      extractionQuality: normaliseExtractionQuality(row.extraction_quality),
      mimeType: (row.mime_type as string | null) ?? null,
      contentHash: (row.content_hash as string | null) ?? null,
      processingError: (row.processing_error as string | null) ?? null,
      processedAt: (row.processed_at as string | null) ?? null,
    };
  });

  const meetings = meetingRows.map((row) => {
    const start = formatTime(row.scheduled_start as string | null);
    const end = formatTime(row.scheduled_end as string | null);
    return {
      id: row.id as string,
      title: row.title as string,
      date: formatDate(row.scheduled_start, "Date not set"),
      time: start && end ? `${start} – ${end}` : start ?? "Time not set",
      project: projectNameById.get(row.project_id as string) ?? "No project",
      objective: (row.objective as string) ?? "",
      attendees: (row.attendees as string[]) ?? [],
      projectId: (row.project_id as string | null) ?? null,
      scheduledStart: (row.scheduled_start as string | null) ?? null,
      scheduledEnd: (row.scheduled_end as string | null) ?? null,
    };
  });

  const actions = actionRows.map((row) => ({
    id: row.id as string,
    label: row.label as string,
    project: projectNameById.get(row.project_id as string) ?? "No project",
    owner: (row.owner as string | null) ?? null,
    due: row.due_date ? formatDate(row.due_date as string) : null,
    done: Boolean(row.done),
    projectId: (row.project_id as string | null) ?? null,
    meetingId: (row.meeting_id as string | null) ?? null,
    dueDate: (row.due_date as string | null) ?? null,
  }));

  const knowledge = knowledgeRows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    type: row.kind as "Meeting record" | "Decision log" | "Preparation brief" | "Refinement",
    date: formatDate(row.entry_date),
    project: projectNameById.get(row.project_id as string) ?? "No project",
    meeting: row.meeting_id ? meetingTitleById.get(row.meeting_id as string) ?? null : null,
    topic: (row.topic as string) ?? "",
    description: (row.description as string) ?? "",
    content: ((row.content as string[]) ?? []).filter(
      (item): item is string => typeof item === "string"
    ),
    related: ((row.related as string[]) ?? []).filter(
      (item): item is string => typeof item === "string"
    ),
    approved: Boolean(row.approved),
    projectId: (row.project_id as string | null) ?? null,
    meetingId: (row.meeting_id as string | null) ?? null,
    entryDate: (row.entry_date as string | null) ?? null,
  }));

  const projects = projectRows.map((row) => {
    const id = row.id as string;
    const projectDocuments = documentRows.filter((doc) => doc.project_id === id);
    const projectMeetings = meetingRows.filter((meeting) => meeting.project_id === id);
    const projectDecisions = decisionRows.filter((decision) => decision.project_id === id);
    const projectActions = actionRows.filter((action) => action.project_id === id);
    return {
      id,
      name: row.name as string,
      description: (row.description as string) ?? "",
      objective: (row.objective as string) ?? "",
      status: row.status as "Active" | "In review" | "Paused",
      archived: row.archived_at !== null && row.archived_at !== undefined,
      updated: formatDate(row.updated_at, "Recently"),
      documents: projectDocuments.map((doc) => doc.name as string),
      meetings: projectMeetings.map((meeting) => meeting.title as string),
      decisions: projectDecisions.map((decision) => decision.summary as string),
      actions: projectActions.map((action) => action.label as string),
    };
  });

  const writingPreferences = preferenceRow
    ? {
        tone: (preferenceRow.tone as string) ?? DEFAULT_WRITING_PREFERENCES.tone,
        structure:
          (preferenceRow.structure as string) ?? DEFAULT_WRITING_PREFERENCES.structure,
        greeting:
          (preferenceRow.greeting as string) ?? DEFAULT_WRITING_PREFERENCES.greeting,
        signOff: (preferenceRow.sign_off as string) ?? DEFAULT_WRITING_PREFERENCES.signOff,
        preserve:
          (preferenceRow.preserve as string) || DEFAULT_WRITING_PREFERENCES.preserve,
        useExamples:
          typeof preferenceRow.use_examples === "boolean"
            ? preferenceRow.use_examples
            : true,
      }
    : DEFAULT_WRITING_PREFERENCES;

  const writingExamples = exampleRows.map((row) => ({
    id: row.id as string,
    title: row.title as string,
    context: (row.context as string) ?? "",
    approved: `Approved by you · ${formatDate(row.approved_at, "Recently")}`,
    excerpt: row.excerpt as string,
  }));

  return {
    profile: {
      id: user.id,
      email: user.email ?? "",
      fullName: (profile.full_name as string) || user.email?.split("@")[0] || "Member",
      role: (profile.role as string) || "Member",
      emailVerified: Boolean(user.email_confirmed_at),
      notificationPreferences: normaliseNotifications(profile.notification_preferences),
    },
    projects,
    documents,
    meetings,
    actions,
    knowledge,
    writingPreferences,
    writingExamples,
  };
}

export function cleanReturnedWorkspace(data: WorkspaceData) {
  return data;
}

export { formatDate, formatSize, normaliseAnalysis, toIsoDate };
