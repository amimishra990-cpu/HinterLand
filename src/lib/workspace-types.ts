export type ProjectStatus = "Active" | "In review" | "Paused";

export type Project = {
  id: string;
  name: string;
  description: string;
  objective: string;
  status: ProjectStatus;
  archived: boolean;
  updated: string;
  documents: string[];
  meetings: string[];
  decisions: string[];
  actions: string[];
};

export type DocumentExtractionMethod =
  | "pdf-text"
  | "ocr"
  | "mixed"
  | "docx"
  | "image"
  | "manual";

export const SOURCE_KINDS = [
  "Document",
  "Agenda",
  "Previous notes",
  "Transcript",
  "Note",
] as const;

export type SourceKind = (typeof SOURCE_KINDS)[number];

export function isSourceKind(value: unknown): value is SourceKind {
  return typeof value === "string" && (SOURCE_KINDS as readonly string[]).includes(value);
}

export type DocumentExtractionQuality = {
  pageCount: number;
  textPages: number;
  scannedPages: number;
  ocrPages: number;
  lowConfidencePages: number;
  uncertainPages: number;
  duplicatePages: number;
  emptyPages: number;
  repeatedLinesRemoved: number;
  truncated: boolean;
  warnings: string[];
};

export type WorkspaceDocument = {
  id: string;
  name: string;
  type: "PDF" | "DOCX" | "Notes" | "Image";
  project: string;
  uploaded: string;
  size: string;
  status: "Ready" | "Processing" | "Needs review" | "Failed";
  excerpt: string;
  extractedText?: string;
  pageCount?: number | null;
  analysis: {
    summary: string;
    findings: string[];
    gaps: string[];
  };
  projectId?: string | null;
  storagePath?: string | null;
  uploadedAt?: string | null;
  sourceKind: SourceKind;
  extractionMethod?: DocumentExtractionMethod | null;
  extractionConfidence?: number | null;
  extractionQuality?: DocumentExtractionQuality | null;
  mimeType?: string | null;
  contentHash?: string | null;
  processingError?: string | null;
  processedAt?: string | null;
};

export type Meeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  project: string;
  objective: string;
  attendees: string[];
  projectId?: string | null;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
};

export type ActionItem = {
  id: string;
  label: string;
  project: string;
  owner: string | null;
  due: string | null;
  done: boolean;
  projectId?: string | null;
  meetingId?: string | null;
  dueDate?: string | null;
};

export type KnowledgeRecord = {
  id: string;
  title: string;
  type: "Meeting record" | "Decision log" | "Preparation brief" | "Refinement";
  date: string;
  project: string;
  meeting: string | null;
  topic: string;
  description: string;
  content: string[];
  related: string[];
  approved: boolean;
  projectId?: string | null;
  meetingId?: string | null;
  entryDate?: string | null;
};

export type WritingExample = {
  id: string;
  title: string;
  context: string;
  approved: string;
  excerpt: string;
};

export type NotificationPreferences = {
  meetingReminders: boolean;
  approvalRequests: boolean;
  weeklySummary: boolean;
};

export type WritingPreferences = {
  tone: string;
  structure: string;
  greeting: string;
  signOff: string;
  preserve: string;
  useExamples: boolean;
};

export type WorkspaceProfile = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  notificationPreferences: NotificationPreferences;
};

export type WorkspaceData = {
  profile: WorkspaceProfile;
  projects: Project[];
  documents: WorkspaceDocument[];
  meetings: Meeting[];
  actions: ActionItem[];
  knowledge: KnowledgeRecord[];
  writingPreferences: WritingPreferences;
  writingExamples: WritingExample[];
};

export type WorkspacePayload = WorkspaceData & {
  user: {
    id: string;
    email: string;
  };
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  meetingReminders: true,
  approvalRequests: true,
  weeklySummary: false,
};

export const DEFAULT_WRITING_PREFERENCES: WritingPreferences = {
  tone: "Professional",
  structure: "Short, direct sentences",
  greeting: "Warm and brief",
  signOff: "Best,",
  preserve:
    "Keep the original reason and the direct request. Do not add deadlines, owners, or context that I have not stated.",
  useExamples: true,
};
