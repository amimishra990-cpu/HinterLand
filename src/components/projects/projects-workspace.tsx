"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Download,
  FileImage,
  FilePlus2,
  FileText,
  FolderOpen,
  GitCompare,
  Info,
  Loader2,
  MessageCircleQuestion,
  Pencil,
  Plus,
  RefreshCw,
  ScanText,
  Search,
  Send,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { useToast } from "@/components/app/toast";
import {
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  StatusBadge,
  Tabs,
  Textarea,
} from "@/components/app/ui";
import {
  SOURCE_KINDS,
  type ActionItem,
  type DocumentExtractionMethod,
  type Project,
  type ProjectStatus,
  type SourceKind,
  type WorkspaceDocument,
} from "@/lib/workspace-types";
import { downloadTextFile, slugify } from "@/lib/download";
import {
  ACCEPTED_FILE_EXTENSIONS,
  MAX_UPLOAD_BYTES,
  documentKind,
  processDocument,
  fileContentHash,
  type ExtractionProgress,
  type ExtractionResult,
} from "@/lib/document-processing";
import {
  useWorkspace,
  type DocumentPageView,
} from "@/components/app/workspace-provider";
import { AiContextNote, AiMetaNote } from "@/components/app/ai-notice";
import {
  AiRequestError,
  postAi,
  type AiContextSummary,
  type AiMeta,
} from "@/lib/ai-client";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const METHOD_LABELS: Record<DocumentExtractionMethod, string> = {
  "pdf-text": "PDF text",
  ocr: "OCR",
  mixed: "Text + OCR",
  docx: "DOCX text",
  image: "Image OCR",
  manual: "Manual text",
};

const METHOD_DESCRIPTIONS: Record<DocumentExtractionMethod, string> = {
  "pdf-text": "Text read from the PDF's own text layer.",
  ocr: "Text recognized with OCR from scanned pages. Check low-confidence lines.",
  mixed: "Some pages had selectable text; scanned pages went through OCR.",
  docx: "Text read from the DOCX document.",
  image: "Text recognized with OCR from an image. Check low-confidence lines.",
  manual: "Text entered manually.",
};

function methodLabel(method?: DocumentExtractionMethod | null) {
  return method ? METHOD_LABELS[method] : "Extraction not recorded";
}

function isOcrMethod(method?: DocumentExtractionMethod | null) {
  return method === "ocr" || method === "mixed" || method === "image";
}

function confidencePercent(value?: number | null) {
  return value === null || value === undefined ? null : `${Math.round(value * 100)}%`;
}

function hasAcceptedExtension(name: string) {
  return new RegExp(`\\.(${ACCEPTED_FILE_EXTENSIONS.join("|")})$`, "i").test(name);
}

function readableExtractedText(value: string) {
  return value.replace(/\[\[page (\d+)\]\]/gi, "\n\nPage $1\n\n").trim();
}

type VerifiedCitation = {
  documentId: string;
  documentName: string;
  quote: string;
  pageNumber: number | null;
};

type SummaryResponse = {
  action: "summarize";
  summary: string;
  keyPoints: string[];
  citations: VerifiedCitation[];
  unverifiedCount: number;
  meta: AiMeta;
  context: AiContextSummary;
};

type AnalysisPayload = {
  summary: string;
  requirements: string[];
  risks: string[];
  inconsistencies: string[];
  missingInformation: string[];
};

type AnalysisResponse = {
  action: "analyze";
  analysis: AnalysisPayload;
  citations: VerifiedCitation[];
  unverifiedCount: number;
  meta: AiMeta;
  context: AiContextSummary;
};

type AnswerResponse = {
  action: "qa";
  answer: string;
  insufficientContext: boolean;
  followUps: string[];
  citations: VerifiedCitation[];
  unverifiedCount: number;
  meta: AiMeta;
  context: AiContextSummary;
};

type ComparisonResponse = {
  action: "compare";
  comparison: {
    summary: string;
    agreements: string[];
    differences: { topic: string; detail: string; documents: string[] }[];
    conflicts: string[];
    missingFromOneDocument: string[];
  };
  citations: VerifiedCitation[];
  unverifiedCount: number;
  meta: AiMeta;
  context: AiContextSummary;
};

function verificationNotice(unverifiedCount: number) {
  if (unverifiedCount === 0) return null;
  return `${unverifiedCount} citation${unverifiedCount === 1 ? "" : "s"} could not be matched to the source text and ${unverifiedCount === 1 ? "was" : "were"} removed.`;
}

function CitationList({
  citations,
  unverifiedCount,
}: {
  citations: VerifiedCitation[];
  unverifiedCount: number;
}) {
  return (
    <div className="mt-3">
      {citations.length > 0 ? (
        <>
          <p className="app-label">Verified citations</p>
          <ul className="mt-1.5 space-y-1.5">
            {citations.map((citation) => (
              <li
                key={`${citation.documentId}-${citation.quote}`}
                className="rounded-md border px-2.5 py-2 text-[11.5px] leading-5"
                style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
              >
                <span className="font-semibold">{citation.documentName}</span>
                {citation.pageNumber ? (
                  <span style={{ color: "var(--app-muted)" }}> · page {citation.pageNumber}</span>
                ) : null}
                <span className="mt-0.5 block" style={{ color: "var(--app-ink-soft)" }}>
                  “{citation.quote}”
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}
      {unverifiedCount > 0 ? (
        <p className="mt-1.5 flex items-start gap-1.5 text-[10.5px] leading-4" style={{ color: "#8c4a2f" }}>
          <CircleAlert size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
          {verificationNotice(unverifiedCount)}
        </p>
      ) : null}
    </div>
  );
}

function AiPanelEmpty({
  busy,
  label,
  description,
  onRun,
  disabled,
}: {
  busy: boolean;
  label: string;
  description: string;
  onRun: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="rounded-md border px-4 py-5 text-center"
      style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
    >
      <Sparkles size={18} className="mx-auto" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
      <p className="mt-2 text-[12.5px] font-semibold">{label}</p>
      <p className="mx-auto mt-1 max-w-[420px] text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
        {description}
      </p>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className="mt-3"
        onClick={onRun}
        disabled={busy || disabled}
      >
        {busy ? (
          <>
            <span className="app-spinner" aria-hidden="true" />
            Working…
          </>
        ) : (
          <>
            <Sparkles size={13} aria-hidden="true" />
            {label}
          </>
        )}
      </Button>
    </div>
  );
}

function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

function analysisText(doc: WorkspaceDocument, live?: AnalysisPayload | null) {
  const payload = live ?? {
    summary: doc.analysis.summary,
    requirements: [],
    risks: [],
    inconsistencies: [],
    missingInformation: doc.analysis.gaps,
  };
  return [
    `${doc.name} — analysis`,
    `Project: ${doc.project}`,
    "",
    "Summary",
    payload.summary,
    "",
    "Requirements",
    ...(payload.requirements.length > 0
      ? payload.requirements.map((item) => `- ${item}`)
      : ["- None identified."]),
    "",
    "Risks",
    ...(payload.risks.length > 0
      ? payload.risks.map((item) => `- ${item}`)
      : ["- None identified."]),
    "",
    "Inconsistencies",
    ...(payload.inconsistencies.length > 0
      ? payload.inconsistencies.map((item) => `- ${item}`)
      : ["- None identified."]),
    "",
    "Missing information",
    ...(payload.missingInformation.length > 0
      ? payload.missingInformation.map((item) => `- ${item}`)
      : ["- None identified."]),
    "",
    live
      ? "Generated with AI assistance from the stored document text. Citations were checked against the source."
      : "Stored analysis from an earlier review of this document.",
  ].join("\n");
}

function actionMeta(label: string, actions: ActionItem[]) {
  const normalised = label.replace(/\.$/, "").toLowerCase();
  return (
    actions.find(
      (item) => item.label.replace(/\.$/, "").toLowerCase() === normalised
    ) ?? null
  );
}

export function ProjectsWorkspace({
  initialTab,
  initialProject,
  initialDoc,
  initialAction,
}: {
  initialTab?: string;
  initialProject?: string;
  initialDoc?: string;
  initialAction?: string;
}) {
  const toast = useToast();
  const {
    data,
    createProject: createProjectRecord,
    updateProject,
    deleteProject,
    uploadDocument,
    addTextSource,
    updateDocument,
    findDocumentByHash,
    getDocumentPage,
    deleteDocument,
    getDownloadUrl,
    refresh,
  } = useWorkspace();
  const { projects, documents, meetings, actions } = data;

  const initialProjectId =
    initialProject && projects.some((project) => project.id === initialProject)
      ? initialProject
      : projects.find((project) => !project.archived)?.id ?? projects[0]?.id ?? "";
  const initialDocId =
    initialDoc && documents.some((doc) => doc.id === initialDoc)
      ? initialDoc
      : null;

  const [tab, setTab] = useState(
    initialDocId || initialTab === "documents" ? "documents" : "projects"
  );
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);

  const [createOpen, setCreateOpen] = useState(initialAction === "new");
  const [newProject, setNewProject] = useState({
    name: "",
    description: "",
    objective: "",
    status: "Active" as ProjectStatus,
  });
  const [createError, setCreateError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editProject, setEditProject] = useState({
    name: "",
    description: "",
    objective: "",
    status: "Active" as ProjectStatus,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);
  const [archivingId, setArchivingId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [projectFilter, setProjectFilter] = useState("All");

  const [previewId, setPreviewId] = useState<string | null>(initialDocId);
  const [previewTab, setPreviewTab] = useState("preview");

  const [summaryResult, setSummaryResult] = useState<SummaryResponse | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResponse | null>(null);
  const [question, setQuestion] = useState("");
  const [aiBusy, setAiBusy] = useState<"summarize" | "analyze" | "qa" | "compare" | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);

  const [uploadOpen, setUploadOpen] = useState(initialAction === "upload");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadProject, setUploadProject] = useState(initialProjectId);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ExtractionProgress | null>(null);
  const [uploadStage, setUploadStage] = useState<
    "idle" | "hashing" | "processing" | "saving" | "failed"
  >("idle");
  const [duplicateDoc, setDuplicateDoc] = useState<{ id: string; name: string } | null>(null);
  const uploadAbort = useRef<AbortController | null>(null);
  const [uploadSourceKind, setUploadSourceKind] = useState<SourceKind>("Document");

  const [textOpen, setTextOpen] = useState(false);
  const [textEditingId, setTextEditingId] = useState<string | null>(null);
  const [textName, setTextName] = useState("");
  const [textBody, setTextBody] = useState("");
  const [textProject, setTextProject] = useState("");
  const [textSourceKind, setTextSourceKind] = useState<SourceKind>("Note");
  const [textError, setTextError] = useState<string | null>(null);
  const [textSaving, setTextSaving] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("All");

  const [pageView, setPageView] = useState(1);
  const [pageData, setPageData] = useState<DocumentPageView | null>(null);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const activeProjects = projects.filter((project) => !project.archived);
  const archivedProjects = projects.filter((project) => project.archived);

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ??
    activeProjects[0] ??
    projects[0];

  const previewDoc = documents.find((doc) => doc.id === previewId) ?? null;

  const openUpload = (projectId?: string) => {
    setUploadFile(null);
    setUploadName("");
    setUploadProject(projectId ?? selectedProjectId);
    setUploadError(null);
    setUploading(false);
    setUploadProgress(null);
    setUploadStage("idle");
    setDuplicateDoc(null);
    setUploadSourceKind("Document");
    setUploadOpen(true);
  };

  const openText = (doc?: WorkspaceDocument) => {
    if (doc) {
      setTextEditingId(doc.id);
      setTextName(doc.name);
      setTextBody(doc.extractedText ?? "");
      setTextProject(doc.projectId ?? "");
      setTextSourceKind(doc.sourceKind);
    } else {
      setTextEditingId(null);
      setTextName("");
      setTextBody("");
      setTextProject(selectedProjectId);
      setTextSourceKind("Note");
    }
    setTextError(null);
    setTextSaving(false);
    setTextOpen(true);
  };

  const submitText = async () => {
    const name = textName.trim();
    const body = textBody.trim();
    if (!name) {
      setTextError("Add a name for the pasted context.");
      return;
    }
    if (!body) {
      setTextError("Paste some text before saving.");
      return;
    }
    setTextSaving(true);
    setTextError(null);
    const input = {
      name,
      text: body,
      projectId: textProject || null,
      sourceKind: textSourceKind,
    };
    const result = textEditingId
      ? await updateDocument(textEditingId, input)
      : await addTextSource(input);
    if (!result.ok) {
      setTextError(result.error ?? "The pasted context could not be saved.");
      setTextSaving(false);
      return;
    }
    setTextSaving(false);
    setTextOpen(false);
    toast(textEditingId ? "Pasted context updated." : "Pasted context saved.", "success");
  };

  const aiReady = (doc: WorkspaceDocument) => UUID.test(doc.id);


  const resetDocAi = () => {
    setSummaryResult(null);
    setAnalysisResult(null);
    setAnswerResult(null);
    setQuestion("");
    setAiError(null);
  };

  const aiMessage = (failure: unknown, fallback: string) =>
    failure instanceof AiRequestError ? failure.message : fallback;

  const runSummary = async (doc: WorkspaceDocument) => {
    if (!aiReady(doc)) {
      setAiError("This document is not stored in your account yet, so it cannot be sent for analysis.");
      return;
    }
    setPreviewTab("summary");
    setAiBusy("summarize");
    setAiError(null);
    try {
      const response = await postAi<SummaryResponse>("/api/ai/document", {
        action: "summarize",
        documentIds: [doc.id],
        projectId: doc.projectId ?? null,
      });
      setSummaryResult(response);
    } catch (failure) {
      const message = aiMessage(failure, "The summary could not be generated.");
      setAiError(message);
      toast(message, "error");
    } finally {
      setAiBusy(null);
    }
  };

  const runAnalyze = async (doc: WorkspaceDocument) => {
    if (!aiReady(doc)) {
      setAiError("This document is not stored in your account yet, so it cannot be sent for analysis.");
      return;
    }
    setPreviewTab("analysis");
    setAiBusy("analyze");
    setAiError(null);
    try {
      const response = await postAi<AnalysisResponse>("/api/ai/document", {
        action: "analyze",
        documentIds: [doc.id],
        projectId: doc.projectId ?? null,
        persist: true,
      });
      setAnalysisResult(response);
      void refresh();
      toast("Analysis complete. Review the citations before relying on it.", "success");
    } catch (failure) {
      const message = aiMessage(failure, "The analysis could not be generated.");
      setAiError(message);
      toast(message, "error");
    } finally {
      setAiBusy(null);
    }
  };

  const runQuestion = async (doc: WorkspaceDocument, text: string) => {
    if (!aiReady(doc)) {
      setAiError("This document is not stored in your account yet, so it cannot be queried.");
      return;
    }
    if (!text.trim()) {
      setAiError("Type a question about this document.");
      return;
    }
    setPreviewTab("ask");
    setAiBusy("qa");
    setAiError(null);
    try {
      const response = await postAi<AnswerResponse>("/api/ai/document", {
        action: "qa",
        documentIds: [doc.id],
        projectId: doc.projectId ?? null,
        question: text.trim(),
      });
      setAnswerResult(response);
    } catch (failure) {
      const message = aiMessage(failure, "The question could not be answered.");
      setAiError(message);
      toast(message, "error");
    } finally {
      setAiBusy(null);
    }
  };

  const runCompare = async () => {
    if (compareIds.length < 2) {
      toast("Select at least two documents to compare.", "error");
      return;
    }
    setCompareOpen(true);
    setComparison(null);
    setAiBusy("compare");
    setAiError(null);
    try {
      const response = await postAi<ComparisonResponse>("/api/ai/document", {
        action: "compare",
        documentIds: compareIds,
        projectId: null,
      });
      setComparison(response);
    } catch (failure) {
      const message = aiMessage(failure, "The comparison could not be generated.");
      setAiError(message);
      toast(message, "error");
    } finally {
      setAiBusy(null);
    }
  };

  const toggleCompare = (id: string) => {
    setCompareIds((items) => {
      if (items.includes(id)) return items.filter((item) => item !== id);
      if (items.length >= 4) {
        toast("Compare up to four documents at a time.", "info");
        return items;
      }
      return [...items, id];
    });
  };

  const loadPage = async (doc: WorkspaceDocument, pageNumber: number) => {
    if (!UUID.test(doc.id)) return;
    setPageView(pageNumber);
    setPageLoading(true);
    setPageError(null);
    setPageData(null);
    const result = await getDocumentPage(doc.id, pageNumber);
    if (result.error) {
      setPageError(result.error);
    } else {
      setPageData(result.page ?? null);
    }
    setPageLoading(false);
  };

  const openDocument = (doc: WorkspaceDocument, mode: "preview" | "analysis") => {
    const isNewDocument = doc.id !== previewId;
    if (isNewDocument) resetDocAi();
    setPreviewId(doc.id);
    setPreviewTab(mode === "analysis" ? "analysis" : "preview");
    setPageView(1);
    setPageData(null);
    setPageError(null);
    if (mode === "analysis" && aiReady(doc) && (isNewDocument || !analysisResult)) {
      void runAnalyze(doc);
    }
  };

  const changePreviewTab = (value: string) => {
    setPreviewTab(value);
    if (value === "pages" && previewDoc && UUID.test(previewDoc.id) && !pageData && !pageLoading) {
      void loadPage(previewDoc, 1);
    }
  };

  const projectDocuments = (project: Project) =>
    documents.filter((doc) => doc.project === project.name);

  const projectMeetings = (project: Project) =>
    meetings.filter((meeting) => meeting.project === project.name);

  const renderProjectTile = (project: Project) => {
    const active = project.id === selectedProject?.id;
    return (
      <li key={project.id}>
        <button
          type="button"
          onClick={() => setSelectedProjectId(project.id)}
          aria-pressed={active}
          className="w-full rounded-lg border p-3 text-left transition-colors"
          style={{
            borderColor: active ? "var(--app-forest)" : "var(--app-line)",
            backgroundColor: active ? "var(--app-forest-soft)" : "var(--app-panel)",
            opacity: project.archived ? 0.82 : 1,
          }}
        >
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-heading text-[15px] leading-snug">
              {project.name}
            </span>
            <StatusBadge status={project.status} />
            {project.archived ? <Badge tone="neutral">Archived</Badge> : null}
          </span>
          <span
            className="mt-1 block line-clamp-2 text-[11.5px] leading-4"
            style={{ color: "var(--app-muted)" }}
          >
            {project.description}
          </span>
          <span
            className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px]"
            style={{ color: "var(--app-muted)" }}
          >
            <span>{projectDocuments(project).length} documents</span>
            <span>{projectMeetings(project).length} meetings</span>
            <span>Updated {project.updated}</span>
          </span>
        </button>
      </li>
    );
  };

  const openEditProject = (project: Project) => {
    setEditProject({
      name: project.name,
      description: project.description,
      objective: project.objective,
      status: project.status,
    });
    setEditError(null);
    setEditOpen(true);
  };

  const saveProjectEdit = async () => {
    if (!selectedProject) return;
    const name = editProject.name.trim();
    if (!name) {
      setEditError("Add a project name.");
      return;
    }
    if (
      projects.some(
        (project) =>
          project.id !== selectedProject.id &&
          project.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setEditError("A project with this name already exists.");
      return;
    }
    if (!editProject.objective.trim()) {
      setEditError("State the objective so the project has a reason to exist.");
      return;
    }

    setEditSaving(true);
    const result = await updateProject(selectedProject.id, {
      name,
      description: editProject.description.trim(),
      objective: editProject.objective.trim(),
      status: editProject.status,
    });
    setEditSaving(false);

    if (!result.ok) {
      setEditError(result.error ?? "The project could not be updated.");
      return;
    }

    setEditOpen(false);
    toast("Project details updated.", "success");
  };

  const toggleProjectArchive = async (project: Project) => {
    setArchivingId(project.id);
    const result = await updateProject(project.id, { archived: !project.archived });
    setArchivingId(null);
    if (!result.ok) {
      toast(result.error ?? "The project could not be updated.", "error");
      return;
    }
    if (!project.archived) setShowArchived(true);
    toast(
      project.archived
        ? "Project restored to active context."
        : "Project archived. Its documents, meetings, and records are kept.",
      "success"
    );
  };

  const deleteProjectNow = async () => {
    if (!selectedProject) return;
    setDeleteSaving(true);
    const result = await deleteProject(selectedProject.id);
    setDeleteSaving(false);
    if (!result.ok) {
      setDeleteError(result.error ?? "The project could not be deleted.");
      return;
    }
    setDeleteOpen(false);
    setSelectedProjectId("");
    setTab("projects");
    toast("Project deleted. Its documents and meetings were kept.", "success");
  };

  const createProject = async () => {
    const name = newProject.name.trim();
    if (!name) {
      setCreateError("Add a project name.");
      return;
    }
    if (
      projects.some(
        (project) => project.name.toLowerCase() === name.toLowerCase()
      )
    ) {
      setCreateError("A project with this name already exists.");
      return;
    }
    if (!newProject.objective.trim()) {
      setCreateError("State the objective so the project has a reason to exist.");
      return;
    }

    const result = await createProjectRecord({
      name,
      description: newProject.description.trim(),
      objective: newProject.objective.trim(),
      status: newProject.status,
    });

    if (!result.ok) {
      setCreateError(result.error ?? "The project could not be created.");
      return;
    }

    setNewProject({
      name: "",
      description: "",
      objective: "",
      status: "Active",
    });
    setCreateError(null);
    setCreateOpen(false);
    setTab("projects");
    toast("Project saved to your account.", "success");
  };

  const removeDocument = async (doc: WorkspaceDocument) => {
    const result = await deleteDocument(doc.id);
    if (!result.ok) {
      toast(result.error ?? "The document could not be removed.", "error");
      return;
    }
    if (previewId === doc.id) setPreviewId(null);
    toast("Document and its stored file were removed.", "success");
  };

  const filteredDocuments = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return documents.filter((doc) => {
      if (needle && !doc.name.toLowerCase().includes(needle)) return false;
      if (typeFilter !== "All" && doc.type !== typeFilter) return false;
      if (projectFilter !== "All" && doc.project !== projectFilter) return false;
      if (sourceFilter !== "All" && doc.sourceKind !== sourceFilter) return false;
      return true;
    });
  }, [documents, query, typeFilter, projectFilter, sourceFilter]);

  const filtersActive =
    query.trim() !== "" ||
    typeFilter !== "All" ||
    projectFilter !== "All" ||
    sourceFilter !== "All";

  const clearFilters = () => {
    setQuery("");
    setTypeFilter("All");
    setProjectFilter("All");
    setSourceFilter("All");
  };

  const resetUploadResult = () => {
    setUploadError(null);
    setDuplicateDoc(null);
    setUploadProgress(null);
    setUploadStage("idle");
  };

  const validateFile = (file: File) => {
    resetUploadResult();
    if (file.size === 0) {
      setUploadError("The selected file is empty.");
      setUploadFile(null);
      return false;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setUploadError("This file is larger than the 20 MB limit.");
      setUploadFile(null);
      return false;
    }
    if (!documentKind(file)) {
      setUploadError(
        "Only PDF, DOCX, PNG, JPEG, and WebP files are accepted, and the file type must match its name."
      );
      setUploadFile(null);
      return false;
    }
    setUploadFile(file);
    setUploadName(file.name.replace(new RegExp(`\\.(${ACCEPTED_FILE_EXTENSIONS.join("|")})$`, "i"), ""));
    return true;
  };

  const successMessage = (result: ExtractionResult, status?: string) => {
    const parts: string[] = [];
    if (status === "Needs review") {
      parts.push("Saved, but OCR text is marked for review. Open the Pages tab to check low-confidence lines.");
    } else {
      parts.push("Document saved to your account and private storage.");
    }
    if (result.quality.scannedPages > 0) {
      parts.push(
        `${result.quality.scannedPages} scanned page${
          result.quality.scannedPages === 1 ? "" : "s"
        } processed with OCR.`
      );
    }
    if (result.quality.duplicatePages > 0) {
      parts.push(
        `${result.quality.duplicatePages} duplicate page${
          result.quality.duplicatePages === 1 ? "" : "s"
        } detected.`
      );
    }
    if (result.truncated) {
      parts.push("Text extraction stopped at the 50,000-character limit.");
    }
    if (result.warnings.length > 0) {
      parts.push(
        `${result.warnings.length} processing warning${
          result.warnings.length === 1 ? "" : "s"
        } saved with the document.`
      );
    }
    return parts.join(" ");
  };

  const submitUpload = async () => {
    if (!uploadFile) {
      setUploadError("Choose a PDF, DOCX, or image file to add.");
      return;
    }
    if (!uploadName.trim()) {
      setUploadError("Add a document name.");
      return;
    }

    const file = uploadFile;
    const kind = documentKind(file);
    if (!kind) {
      setUploadError("Only PDF, DOCX, PNG, JPEG, and WebP files are accepted.");
      return;
    }

    const project = projects.find((entry) => entry.id === uploadProject) ?? projects[0];
    if (!project) {
      setUploadError("Create a project before adding a document.");
      return;
    }

    const finalName = hasAcceptedExtension(uploadName.trim())
      ? uploadName.trim()
      : `${uploadName.trim()}.${kind.extension}`;

    const controller = new AbortController();
    uploadAbort.current = controller;
    setUploading(true);
    setUploadError(null);
    setDuplicateDoc(null);
    setUploadStage("hashing");
    setUploadProgress({
      phase: "reading",
      page: 0,
      pageCount: 0,
      ratio: 0.01,
      label: "Checking the file fingerprint for duplicates",
    });

    try {
      const contentHash = await fileContentHash(file);
      if (contentHash) {
        const existing = await findDocumentByHash(contentHash);
        if (existing.document) {
          setDuplicateDoc({ id: existing.document.id, name: existing.document.name });
          setUploadError(
            `This file is already in your library as "${existing.document.name}". It was not processed again.`
          );
          setUploadStage("idle");
          setUploadProgress(null);
          return;
        }
      }

      setUploadStage("processing");
      const result = await processDocument(file, {
        signal: controller.signal,
        onProgress: setUploadProgress,
      });

      if (controller.signal.aborted) {
        throw new Error("Document processing was cancelled.");
      }

      setUploadStage("saving");
      setUploadProgress({
        phase: "finalizing",
        page: result.pageCount ?? 0,
        pageCount: result.pageCount ?? 0,
        ratio: 1,
        label: "Saving the document to your private library",
      });

      const saved = await uploadDocument(file, {
        name: finalName,
        projectId: project.id,
        extractedText: result.text,
        pageCount: result.pageCount,
        extractionMethod: result.method,
        extractionConfidence: result.confidence,
        extractionQuality: {
          ...result.quality,
          warnings: result.warnings.map((warning) => warning.message),
        },
        contentHash: result.contentHash,
        mimeType: result.mimeType,
        sourceKind: uploadSourceKind,
        pages: result.pages.map((page) => ({
          pageNumber: page.pageNumber,
          text: page.text,
          extractionMethod: page.method,
          confidence: page.confidence,
          uncertain: page.uncertain,
          uncertainLines: page.uncertainLines,
          rotationApplied: page.rotationApplied,
          duplicateOf: page.duplicateOf,
        })),
      });

      if (!saved.ok) {
        setUploadError(saved.error ?? "The document could not be saved.");
        setUploadStage("failed");
        toast(saved.error ?? "The document could not be saved.", "error");
        return;
      }

      setUploadOpen(false);
      setTab("documents");
      setUploadFile(null);
      setUploadName("");
      setUploadProgress(null);
      setUploadStage("idle");
      toast(successMessage(result, saved.status), "success");
    } catch (error) {
      const message =
        controller.signal.aborted
          ? "Processing was cancelled. You can retry when ready."
          : error instanceof Error
            ? error.message
            : "The document could not be processed.";
      setUploadError(message);
      setUploadStage("failed");
      setUploadProgress(null);
      toast(message, "error");
    } finally {
      setUploading(false);
      uploadAbort.current = null;
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Projects & Documents"
        title="The context behind the work"
        description="Projects hold the objective, decisions, documents, and meetings that shape each piece of communication. The library keeps source material close to the point of use."
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateError(null);
                setCreateOpen(true);
              }}
            >
              <Plus size={14} aria-hidden="true" />
              New project
            </Button>
            <Button type="button" variant="secondary" onClick={() => openText()}>
              <FilePlus2 size={14} aria-hidden="true" />
              Paste text
            </Button>
            <Button
              type="button"
              onClick={() => openUpload()}
              disabled={projects.length === 0}
            >
              <Upload size={14} aria-hidden="true" />
              Upload document
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <div className="px-4 pt-1 sm:px-5">
          <Tabs
            items={[
              { value: "projects", label: "Projects", count: projects.length },
              { value: "documents", label: "Document library", count: documents.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>

        {tab === "projects" ? (
          !selectedProject ? (
            <EmptyState
              icon={<FolderOpen size={18} />}
              title="No projects yet"
              description="Create your first project to give documents, meetings, and writing context a place to live."
              action={
                <Button
                  type="button"
                  onClick={() => {
                    setCreateError(null);
                    setCreateOpen(true);
                  }}
                >
                  <Plus size={14} aria-hidden="true" />
                  New project
                </Button>
              }
            />
          ) : (
          <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-12">
            <div className="xl:col-span-4">
              <div className="flex items-center justify-between gap-2">
                <p className="app-label" style={{ marginBottom: 0 }}>
                  Active context
                </p>
                <Badge tone="forest">Private to you</Badge>
              </div>
              <ul className="mt-2 space-y-2">
                {activeProjects.map(renderProjectTile)}
              </ul>
              {activeProjects.length === 0 ? (
                <p className="mt-2 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
                  No active projects.{" "}
                  {archivedProjects.length > 0
                    ? "Restore an archived project or create a new one."
                    : "Create a project to begin."}
                </p>
              ) : null}

              {archivedProjects.length > 0 ? (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowArchived((value) => !value)}
                    aria-expanded={showArchived}
                    className="flex w-full items-center justify-between gap-2 rounded-md border px-2.5 py-2 text-[11px] font-medium"
                    style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Archive size={12} aria-hidden="true" />
                      Archived ({archivedProjects.length})
                    </span>
                    <span>{showArchived ? "Hide" : "Show"}</span>
                  </button>
                  {showArchived ? (
                    <ul className="mt-2 space-y-2">{archivedProjects.map(renderProjectTile)}</ul>
                  ) : null}
                </div>
              ) : null}

              <div
                className="mt-3 flex items-start gap-2 rounded-md border px-3 py-2.5 text-[11px] leading-4"
                style={{
                  borderColor: "var(--app-line)",
                  backgroundColor: "var(--app-panel-soft)",
                  color: "var(--app-muted)",
                }}
              >
                <Info size={13} className="mt-0.5 shrink-0" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
                <span>Projects and files are stored in your account and protected by row-level security.</span>
              </div>
            </div>

            <div className="xl:col-span-8">
              <Card soft className="p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-heading text-[22px] leading-snug">
                        {selectedProject.name}
                      </h2>
                      <StatusBadge status={selectedProject.status} />
                      {selectedProject.archived ? <Badge tone="neutral">Archived</Badge> : null}
                    </div>
                    <p className="mt-2 text-[12.5px] leading-5" style={{ color: "var(--app-ink-soft)" }}>
                      {selectedProject.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setTab("documents");
                        setProjectFilter(selectedProject.name);
                        setTypeFilter("All");
                        setQuery("");
                      }}
                    >
                      <FolderOpen size={13} aria-hidden="true" />
                      Open documents
                    </Button>
                    <Link
                      href="/app/knowledge"
                      className="app-btn app-btn-secondary app-btn-sm"
                    >
                      <BookOpen size={13} aria-hidden="true" />
                      Knowledge
                    </Link>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => openEditProject(selectedProject)}
                    >
                      <Pencil size={13} aria-hidden="true" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void toggleProjectArchive(selectedProject)}
                      disabled={archivingId === selectedProject.id}
                    >
                      {selectedProject.archived ? (
                        <ArchiveRestore size={13} aria-hidden="true" />
                      ) : (
                        <Archive size={13} aria-hidden="true" />
                      )}
                      {selectedProject.archived ? "Restore" : "Archive"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setDeleteError(null);
                        setDeleteOpen(true);
                      }}
                      aria-label={`Delete ${selectedProject.name}`}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                <div
                  className="mt-4 rounded-md border-l-2 px-3 py-2.5"
                  style={{ borderColor: "var(--app-gold)", backgroundColor: "var(--app-gold-soft)" }}
                >
                  <p className="app-label" style={{ marginBottom: 2 }}>
                    Objective
                  </p>
                  <p className="text-[12.5px] leading-5" style={{ color: "#5f4a1d" }}>
                    {selectedProject.objective}
                  </p>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <section>
                    <h3 className="app-label">Related documents</h3>
                    <ul className="space-y-1">
                      {projectDocuments(selectedProject).map((doc) => (
                        <li key={doc.id}>
                          <button
                            type="button"
                            onClick={() => openDocument(doc, "preview")}
                            className="flex w-full items-center gap-2 rounded-md border px-2.5 py-2 text-left transition-colors hover:border-[color:var(--app-gold)]"
                            style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel)" }}
                          >
                            <FileText size={13} style={{ color: "var(--app-gold)" }} aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12px] font-medium">{doc.name}</span>
                              <span className="block text-[10px]" style={{ color: "var(--app-muted)" }}>
                                {doc.type} · {doc.uploaded}
                              </span>
                            </span>
                            <ArrowRight size={12} style={{ color: "var(--app-muted)" }} aria-hidden="true" />
                          </button>
                        </li>
                      ))}
                      {projectDocuments(selectedProject).length === 0 ? (
                        <li className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                          No documents are linked to this project.
                        </li>
                      ) : null}
                    </ul>
                  </section>

                  <section>
                    <h3 className="app-label">Meetings</h3>
                    <ul className="space-y-1">
                      {projectMeetings(selectedProject).map((meeting) => (
                        <li key={meeting.id}>
                          <Link
                            href={`/app/preparation?meeting=${meeting.id}`}
                            className="flex items-center gap-2 rounded-md border px-2.5 py-2 transition-colors hover:border-[color:var(--app-gold)]"
                            style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel)" }}
                          >
                            <CalendarDays size={13} style={{ color: "var(--app-forest)" }} aria-hidden="true" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[12px] font-medium">{meeting.title}</span>
                              <span className="block text-[10px]" style={{ color: "var(--app-muted)" }}>
                                {meeting.date} · {meeting.time}
                              </span>
                            </span>
                            <ArrowRight size={12} style={{ color: "var(--app-muted)" }} aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                      {projectMeetings(selectedProject).length === 0 ? (
                        <li className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                          No meetings are linked to this project.
                        </li>
                      ) : null}
                    </ul>
                  </section>

                  <section>
                    <h3 className="app-label">Important decisions</h3>
                    <ul className="space-y-1.5">
                      {selectedProject.decisions.map((decision) => (
                        <li key={decision} className="flex items-start gap-2">
                          <CheckCircle2
                            size={13}
                            className="mt-0.5 shrink-0"
                            style={{ color: "var(--app-forest)" }}
                            aria-hidden="true"
                          />
                          <span className="text-[12px] leading-5">{decision}</span>
                        </li>
                      ))}
                      {selectedProject.decisions.length === 0 ? (
                        <li className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                          No decisions are recorded for this project yet.
                        </li>
                      ) : null}
                    </ul>
                  </section>

                  <section>
                    <h3 className="app-label">Action items</h3>
                    <ul className="space-y-1.5">
                      {selectedProject.actions.map((action) => {
                        const meta = actionMeta(action, actions);
                        return (
                          <li key={action} className="rounded-md border px-2.5 py-2" style={{ borderColor: "var(--app-line)" }}>
                            <p className="text-[12px] leading-5">{action}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              <Badge tone={meta?.owner ? "forest" : "neutral"}>
                                Owner: {meta?.owner ?? "Not specified"}
                              </Badge>
                              <Badge tone={meta?.due ? "forest" : "neutral"}>
                                Due: {meta?.due ?? "Not specified"}
                              </Badge>
                            </div>
                          </li>
                        );
                      })}
                      {selectedProject.actions.length === 0 ? (
                        <li className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                          No action items are linked to this project yet.
                        </li>
                      ) : null}
                    </ul>
                  </section>
                </div>
              </Card>
            </div>
          </div>
          )
        ) : (
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2"
                  style={{ color: "var(--app-muted)" }}
                  aria-hidden="true"
                />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search documents by name…"
                  aria-label="Search documents by name"
                  style={{ paddingLeft: 30 }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                <Select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  aria-label="Filter by document type"
                  className="sm:w-[126px]"
                >
                  <option value="All">All types</option>
                  <option value="PDF">PDF</option>
                  <option value="DOCX">DOCX</option>
                  <option value="Image">Image</option>
                  <option value="Notes">Notes</option>
                </Select>
                <Select
                  value={projectFilter}
                  onChange={(event) => setProjectFilter(event.target.value)}
                  aria-label="Filter by project"
                  className="sm:w-[186px]"
                >
                  <option value="All">All projects</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.name}>
                      {project.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                  aria-label="Filter by source label"
                  className="sm:w-[160px]"
                >
                  <option value="All">All labels</option>
                  {SOURCE_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex items-center gap-2">
                {compareIds.length > 0 ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => void runCompare()}
                    disabled={compareIds.length < 2 || aiBusy === "compare"}
                    title="Compare the selected documents"
                  >
                    <GitCompare size={13} aria-hidden="true" />
                    Compare ({compareIds.length})
                  </Button>
                ) : null}
                {filtersActive ? (
                  <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : null}
                <Button type="button" size="sm" onClick={() => openUpload()} className="shrink-0">
                  <FilePlus2 size={13} aria-hidden="true" />
                  Add
                </Button>
              </div>
            </div>

            <p className="mt-2.5 text-[11px]" style={{ color: "var(--app-muted)" }}>
              {filteredDocuments.length} of {documents.length} documents · extracted text and
              original files are stored in your private storage area
            </p>

            {documents.length === 0 ? (
              <EmptyState
                icon={<FileText size={18} />}
                title="No sources yet"
                description="Upload a PDF or DOCX, or paste an agenda, transcript, or note. Extracted text is searchable and stays in your private storage area."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button type="button" onClick={() => openText()}>
                      <FilePlus2 size={13} aria-hidden="true" />
                      Paste text
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => openUpload()}
                      disabled={projects.length === 0}
                    >
                      <Upload size={13} aria-hidden="true" />
                      Upload document
                    </Button>
                  </div>
                }
              />
            ) : filteredDocuments.length === 0 ? (
              <EmptyState
                icon={<Search size={18} />}
                title="No documents match these filters"
                description="Try a different type or project, or clear the filters to see your full document library."
                action={
                  <Button type="button" variant="secondary" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <ul className="mt-3 divide-y" style={{ borderColor: "var(--app-line)" }}>
                {filteredDocuments.map((doc) => (
                  <li key={doc.id} style={{ borderColor: "var(--app-line)" }}>
                    <div className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center">
                      <div className="flex min-w-0 flex-1 items-start gap-2.5">
                        <input
                          type="checkbox"
                          checked={compareIds.includes(doc.id)}
                          onChange={() => toggleCompare(doc.id)}
                          disabled={!UUID.test(doc.id)}
                          aria-label={`Select ${doc.name} for comparison`}
                          className="mt-2 h-3.5 w-3.5 shrink-0 accent-[color:var(--app-forest)]"
                        />
                        <span
                          className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                          style={{ backgroundColor: "var(--app-panel-strong)", color: "var(--app-gold)" }}
                          aria-hidden="true"
                        >
                          {doc.type === "Image" ? <FileImage size={15} /> : <FileText size={15} />}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDocument(doc, "preview")}
                              className="truncate text-left text-[12.5px] font-semibold hover:underline"
                            >
                              {doc.name}
                            </button>
                            <Badge tone="neutral">{doc.type}</Badge>
                            <Badge tone={doc.sourceKind === "Document" ? "neutral" : "gold"}>
                              {doc.sourceKind}
                            </Badge>
                            <StatusBadge status={doc.status} />
                            {isOcrMethod(doc.extractionMethod) ? (
                              <Badge tone="gold">
                                <ScanText size={11} className="mr-1" aria-hidden="true" />
                                {methodLabel(doc.extractionMethod as DocumentExtractionMethod)}
                                {confidencePercent(doc.extractionConfidence)
                                  ? ` ${confidencePercent(doc.extractionConfidence)}`
                                  : ""}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-[11px]" style={{ color: "var(--app-muted)" }}>
                            {doc.project} · {doc.uploaded} · {doc.size}
                            {doc.pageCount ? ` · ${doc.pageCount} pages` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 pl-10 sm:pl-0">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => openDocument(doc, "preview")}
                        >
                          Preview
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => openDocument(doc, "analysis")}
                        >
                          Analysis
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void removeDocument(doc)}
                          aria-label={`Remove ${doc.name}`}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(previewDoc)}
        onClose={() => setPreviewId(null)}
        title={previewDoc?.name ?? "Document preview"}
        description={
          previewDoc
            ? `${previewDoc.type} · ${previewDoc.project} · Uploaded ${previewDoc.uploaded}`
            : undefined
        }
        size="lg"
        footer={
          previewDoc ? (
            <>
              {previewDoc.storagePath ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const result = await getDownloadUrl(previewDoc.id);
                    if (!result.url) {
                      toast(result.error ?? "The download link could not be created.", "error");
                      return;
                    }
                    window.open(result.url, "_blank", "noopener,noreferrer");
                  }}
                >
                  <Download size={14} aria-hidden="true" />
                  Download original
                </Button>
              ) : null}
              <CopyButton
                value={analysisText(previewDoc, analysisResult?.analysis)}
                label="Copy analysis"
                success="Analysis copied."
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  downloadTextFile(
                    `${slugify(previewDoc.name.replace(/\.(pdf|docx)$/i, ""), "document")}-analysis.md`,
                    analysisText(previewDoc, analysisResult?.analysis),
                    "text/markdown;charset=utf-8"
                  );
                  toast("Analysis downloaded as a Markdown file.", "success");
                }}
              >
                <Download size={14} aria-hidden="true" />
                Download analysis
              </Button>
              <Button type="button" onClick={() => setPreviewId(null)}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        {previewDoc ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="neutral">{previewDoc.type}</Badge>
              <Badge tone={previewDoc.sourceKind === "Document" ? "neutral" : "gold"}>
                {previewDoc.sourceKind}
              </Badge>
              <StatusBadge status={previewDoc.status} />
              <span className="text-[11px]" style={{ color: "var(--app-muted)" }}>
                {previewDoc.size}
              </span>
              {previewDoc.extractionMethod ? (
                <Badge tone={isOcrMethod(previewDoc.extractionMethod) ? "gold" : "neutral"}>
                  {methodLabel(previewDoc.extractionMethod)}
                  {confidencePercent(previewDoc.extractionConfidence)
                    ? ` · ${confidencePercent(previewDoc.extractionConfidence)}`
                    : ""}
                </Badge>
              ) : null}
              {previewDoc.extractionQuality &&
              (previewDoc.extractionQuality.uncertainPages > 0 ||
                previewDoc.extractionQuality.duplicatePages > 0) ? (
                <Badge tone="terracotta">
                  {[
                    previewDoc.extractionQuality.uncertainPages > 0
                      ? `${previewDoc.extractionQuality.uncertainPages} uncertain page${
                          previewDoc.extractionQuality.uncertainPages === 1 ? "" : "s"
                        }`
                      : "",
                    previewDoc.extractionQuality.duplicatePages > 0
                      ? `${previewDoc.extractionQuality.duplicatePages} duplicate page${
                          previewDoc.extractionQuality.duplicatePages === 1 ? "" : "s"
                        }`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </Badge>
              ) : null}
              {!previewDoc.storagePath && previewDoc.type === "Notes" ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const doc = previewDoc;
                    setPreviewId(null);
                    openText(doc);
                  }}
                >
                  Edit text
                </Button>
              ) : null}
            </div>

            <Tabs
              items={[
                { value: "preview", label: "Preview" },
                ...(UUID.test(previewDoc.id) && previewDoc.pageCount
                  ? [{ value: "pages", label: "Pages" }]
                  : []),
                { value: "summary", label: "Summary" },
                { value: "analysis", label: "Analysis" },
                { value: "ask", label: "Ask" },
              ]}
              value={previewTab}
              onChange={changePreviewTab}
              className="mt-2"
            />

            {aiError ? (
              <p className="mt-2 flex items-start gap-1.5 text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
                <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                {aiError}
              </p>
            ) : null}

            {previewTab === "preview" ? (
              <div className="mt-4">
                <div
                  className="rounded-md border px-5 py-6"
                  style={{ borderColor: "var(--app-line)", backgroundColor: "#fffdf8" }}
                >
                  <p className="app-eyebrow">Extracted text</p>
                  <h3 className="mt-2 font-heading text-[19px]">{previewDoc.name}</h3>
                  <p className="mt-1 text-[11px]" style={{ color: "var(--app-muted)" }}>
                    {previewDoc.project}
                    {previewDoc.pageCount ? ` · ${previewDoc.pageCount} pages` : ""}
                    {" · Extracted text"}
                  </p>
                  <div className="app-rule my-4" />
                  <p className="app-prose max-h-[55vh] overflow-y-auto whitespace-pre-wrap">
                    {readableExtractedText(previewDoc.extractedText ?? previewDoc.excerpt)}
                  </p>
                  <div className="app-rule my-4" />
                  <p className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                    {previewDoc.extractionMethod
                      ? METHOD_DESCRIPTIONS[previewDoc.extractionMethod]
                      : "Extracted text is stored with the document record."}{" "}
                    Text extraction is limited to 50,000 characters. Scanned pages and document
                    photos are processed with OCR in this browser; uncertain lines are marked in
                    the Pages tab. The original file is held in private storage.
                  </p>
                  {previewDoc.extractionQuality?.warnings.length ? (
                    <ul
                      className="mt-2 space-y-1 text-[10.5px]"
                      style={{ color: "var(--app-terracotta)" }}
                    >
                      {previewDoc.extractionQuality.warnings.slice(0, 5).map((warning) => (
                        <li key={warning} className="flex items-start gap-1.5">
                          <CircleAlert size={11} className="mt-0.5 shrink-0" aria-hidden="true" />
                          {warning}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ) : null}

            {previewTab === "pages" ? (
              <div className="mt-4">
                {!previewDoc.pageCount ? (
                  <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                    This document does not expose page boundaries. Use Preview to read the
                    extracted text.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="app-label" style={{ marginBottom: 0 }}>
                        Page {pageView} of {previewDoc.pageCount}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pageView <= 1 || pageLoading}
                          onClick={() => void loadPage(previewDoc, pageView - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={pageView >= previewDoc.pageCount || pageLoading}
                          onClick={() => void loadPage(previewDoc, pageView + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    {pageLoading ? (
                      <div className="mt-3 flex items-center gap-2 text-[12px]" style={{ color: "var(--app-muted)" }}>
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        Loading page {pageView}…
                      </div>
                    ) : pageError ? (
                      <p className="mt-3 flex items-start gap-1.5 text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
                        <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                        {pageError}
                      </p>
                    ) : !pageData ? (
                      <p className="mt-3 text-[12px]" style={{ color: "var(--app-muted)" }}>
                        This page has no indexed text. It may be blank or was uploaded before the
                        page index existed.
                      </p>
                    ) : (
                      <div
                        className="mt-3 rounded-md border px-5 py-5"
                        style={{ borderColor: "var(--app-line)", backgroundColor: "#fffdf8" }}
                      >
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge tone={isOcrMethod(pageData.extractionMethod as DocumentExtractionMethod) ? "gold" : "neutral"}>
                            {methodLabel(pageData.extractionMethod as DocumentExtractionMethod)}
                          </Badge>
                          {confidencePercent(pageData.confidence) ? (
                            <Badge
                              tone={
                                (pageData.confidence ?? 1) < 0.75 ? "terracotta" : "forest"
                              }
                            >
                              {confidencePercent(pageData.confidence)} confidence
                            </Badge>
                          ) : null}
                          {pageData.rotationApplied ? (
                            <Badge tone="neutral">Rotated {pageData.rotationApplied}°</Badge>
                          ) : null}
                          {pageData.duplicateOf ? (
                            <Badge tone="terracotta">
                              Duplicate of page {pageData.duplicateOf}
                            </Badge>
                          ) : null}
                        </div>

                        {pageData.uncertain ? (
                          <div
                            className="mt-3 rounded-md border px-3 py-2.5"
                            style={{
                              borderColor: "color-mix(in srgb, var(--app-terracotta) 35%, transparent)",
                              backgroundColor: "color-mix(in srgb, var(--app-terracotta) 8%, transparent)",
                            }}
                          >
                            <p className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "var(--app-terracotta)" }}>
                              <CircleAlert size={12} aria-hidden="true" />
                              Low-confidence OCR. Treat this text as unverified.
                            </p>
                            {pageData.uncertainLines.length > 0 ? (
                              <ul className="mt-1.5 space-y-0.5 text-[11px]" style={{ color: "var(--app-text)" }}>
                                {pageData.uncertainLines.slice(0, 6).map((line, index) => (
                                  <li key={`${index}-${line}`} className="font-mono">
                                    “{line}”
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </div>
                        ) : null}

                        <p className="app-prose mt-3 max-h-[50vh] overflow-y-auto whitespace-pre-wrap">
                          {pageData.text || "No text was recognized on this page."}
                        </p>
                        <p className="mt-3 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                          AI citations reference this page as page {pageData.pageNumber}. Page
                          text is stored in the private page index for your account only.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            ) : null}

            {previewTab === "summary" ? (
              <div className="mt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="app-label" style={{ marginBottom: 0 }}>
                    Document summary
                  </p>
                  {summaryResult ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => void runSummary(previewDoc)}
                      disabled={aiBusy === "summarize"}
                    >
                      <Sparkles size={13} aria-hidden="true" />
                      Regenerate
                    </Button>
                  ) : null}
                </div>
                {aiBusy === "summarize" ? (
                  <div className="mt-3 space-y-2.5" aria-live="polite">
                    <div className="app-skeleton h-4 w-2/5" />
                    <div className="app-skeleton h-3 w-full" />
                    <div className="app-skeleton h-3 w-11/12" />
                    <div className="app-skeleton h-3 w-4/5" />
                  </div>
                ) : summaryResult ? (
                  <div className="mt-2">
                    <p className="app-prose">{summaryResult.summary}</p>
                    {summaryResult.keyPoints.length > 0 ? (
                      <>
                        <p className="app-label mt-4">Key points</p>
                        <ul className="mt-1.5 space-y-1.5">
                          {summaryResult.keyPoints.map((point) => (
                            <li key={point} className="flex items-start gap-2">
                              <CheckCircle2
                                size={13}
                                className="mt-0.5 shrink-0"
                                style={{ color: "var(--app-forest)" }}
                                aria-hidden="true"
                              />
                              <span className="text-[12px] leading-5">{point}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : null}
                    <CitationList
                      citations={summaryResult.citations}
                      unverifiedCount={summaryResult.unverifiedCount}
                    />
                    <div
                      className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-[10.5px]"
                      style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
                    >
                      <AiMetaNote meta={summaryResult.meta} />
                      <CopyButton
                        value={[summaryResult.summary, "", ...summaryResult.keyPoints.map((point) => `- ${point}`)].join("\n")}
                        label="Copy summary"
                        success="Summary copied."
                      />
                    </div>
                    <AiContextNote context={summaryResult.context} />
                  </div>
                ) : (
                  <div className="mt-2">
                    <AiPanelEmpty
                      busy={false}
                      label="Summarize document"
                      description="The model reads the stored extracted text and returns a summary with verified citations. Nothing is sent until you choose to run it."
                      onRun={() => void runSummary(previewDoc)}
                      disabled={!aiReady(previewDoc)}
                    />
                  </div>
                )}
              </div>
            ) : null}

            {previewTab === "analysis" ? (
              <div className="mt-4 space-y-4">
                {aiBusy === "analyze" ? (
                  <div className="space-y-2.5" aria-live="polite">
                    <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--app-muted)" }}>
                      <span className="app-spinner" aria-hidden="true" />
                      Reading the document and checking citations…
                    </div>
                    <div className="app-skeleton h-4 w-2/5" />
                    <div className="app-skeleton h-3 w-full" />
                    <div className="app-skeleton h-3 w-11/12" />
                  </div>
                ) : analysisResult ? (
                  <>
                    <div>
                      <p className="app-label">Summary</p>
                      <p className="app-prose">{analysisResult.analysis.summary}</p>
                    </div>
                    {(
                      [
                        ["Requirements", analysisResult.analysis.requirements],
                        ["Risks", analysisResult.analysis.risks],
                        ["Inconsistencies", analysisResult.analysis.inconsistencies],
                        ["Missing information", analysisResult.analysis.missingInformation],
                      ] as const
                    ).map(([label, items]) => (
                      <div key={label}>
                        <p className="app-label">{label}</p>
                        {items.length === 0 ? (
                          <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                            None identified in the document.
                          </p>
                        ) : (
                          <ul className="mt-1 space-y-1.5">
                            {items.map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <CircleAlert
                                  size={13}
                                  className="mt-0.5 shrink-0"
                                  style={{
                                    color:
                                      label === "Risks" || label === "Inconsistencies"
                                        ? "var(--app-terracotta)"
                                        : "var(--app-gold)",
                                  }}
                                  aria-hidden="true"
                                />
                                <span className="text-[12px] leading-5">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                    <CitationList
                      citations={analysisResult.citations}
                      unverifiedCount={analysisResult.unverifiedCount}
                    />
                    <div
                      className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-[10.5px]"
                      style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
                    >
                      <AiMetaNote meta={analysisResult.meta} />
                      <div className="flex items-center gap-2">
                        <span>Saved to the document record</span>
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => void runAnalyze(previewDoc)}
                        >
                          <Sparkles size={13} aria-hidden="true" />
                          Re-run
                        </Button>
                      </div>
                    </div>
                    <AiContextNote context={analysisResult.context} />
                  </>
                ) : (
                  <>
                    <AiPanelEmpty
                      busy={false}
                      label="Run AI analysis"
                      description="Extracts requirements, risks, inconsistencies, and missing information, then verifies every citation against the document text."
                      onRun={() => void runAnalyze(previewDoc)}
                      disabled={!aiReady(previewDoc)}
                    />
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="app-label" style={{ marginBottom: 0 }}>
                          Stored analysis
                        </p>
                        <Badge tone="neutral">Earlier review</Badge>
                      </div>
                      <p className="app-prose mt-1.5">{previewDoc.analysis.summary}</p>
                      {previewDoc.analysis.findings.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {previewDoc.analysis.findings.map((finding) => (
                            <li key={finding} className="flex items-start gap-2">
                              <CheckCircle2
                                size={13}
                                className="mt-0.5 shrink-0"
                                style={{ color: "var(--app-forest)" }}
                                aria-hidden="true"
                              />
                              <span className="text-[12px] leading-5">{finding}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      {previewDoc.analysis.gaps.length > 0 ? (
                        <ul className="mt-2 space-y-1.5">
                          {previewDoc.analysis.gaps.map((gap) => (
                            <li
                              key={gap}
                              className="flex items-start gap-2 rounded-md px-2.5 py-2"
                              style={{ backgroundColor: "var(--app-terracotta-soft)" }}
                            >
                              <CircleAlert
                                size={13}
                                className="mt-0.5 shrink-0"
                                style={{ color: "var(--app-terracotta)" }}
                                aria-hidden="true"
                              />
                              <span className="text-[12px] leading-5">{gap}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                      <p className="mt-2 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                        Stored findings are not re-verified. Run the analysis to check them
                        against the current document text.
                      </p>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {previewTab === "ask" ? (
              <div className="mt-4">
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    void runQuestion(previewDoc, question);
                  }}
                >
                  <Field
                    label="Question about this document"
                    htmlFor="doc-question"
                    hint="Answered only from this document; missing information is stated as missing."
                  >
                    <Textarea
                      id="doc-question"
                      rows={3}
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      placeholder="e.g. What deadline does the document commit to?"
                    />
                  </Field>
                  <Button
                    type="submit"
                    size="sm"
                    className="mt-2"
                    disabled={aiBusy === "qa" || !question.trim()}
                  >
                    {aiBusy === "qa" ? (
                      <>
                        <span className="app-spinner" aria-hidden="true" />
                        Answering…
                      </>
                    ) : (
                      <>
                        <Send size={13} aria-hidden="true" />
                        Ask
                      </>
                    )}
                  </Button>
                </form>

                {answerResult && aiBusy !== "qa" ? (
                  <div className="mt-4">
                    {answerResult.insufficientContext ? (
                      <p
                        className="mb-3 flex items-start gap-2 rounded-md px-3 py-2.5 text-[11.5px] leading-5"
                        style={{ backgroundColor: "var(--app-terracotta-soft)", color: "#7a3a2a" }}
                      >
                        <MessageCircleQuestion size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                        The document does not contain enough information to answer this fully.
                      </p>
                    ) : null}
                    <p className="app-label">Answer</p>
                    <p className="app-prose mt-1.5 whitespace-pre-wrap">{answerResult.answer}</p>
                    <CitationList
                      citations={answerResult.citations}
                      unverifiedCount={answerResult.unverifiedCount}
                    />
                    {answerResult.followUps.length > 0 ? (
                      <div className="mt-3">
                        <p className="app-label">Follow-up questions</p>
                        <div className="mt-1.5 flex flex-wrap gap-1.5">
                          {answerResult.followUps.map((followUp) => (
                            <button
                              key={followUp}
                              type="button"
                              className="rounded-full border px-2.5 py-1 text-[11px] transition-colors hover:border-[color:var(--app-gold)]"
                              style={{ borderColor: "var(--app-line-strong)", color: "var(--app-ink-soft)" }}
                              onClick={() => {
                                setQuestion(followUp);
                                void runQuestion(previewDoc, followUp);
                              }}
                            >
                              {followUp}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                    <div
                      className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-[10.5px]"
                      style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
                    >
                      <AiMetaNote meta={answerResult.meta} />
                      <CopyButton value={answerResult.answer} label="Copy answer" success="Answer copied." />
                    </div>
                    <AiContextNote context={answerResult.context} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <Modal
        open={compareOpen}
        onClose={() => {
          setCompareOpen(false);
          setComparison(null);
          setAiError(null);
        }}
        title="Compare documents"
        description={
          compareIds.length > 0
            ? compareIds
                .map((id) => documents.find((doc) => doc.id === id)?.name)
                .filter(Boolean)
                .join(" · ")
            : "Select two or more documents"
        }
        size="lg"
        footer={
          <>
            {comparison ? (
              <CopyButton
                value={[
                  comparison.comparison.summary,
                  "",
                  "Agreements",
                  ...comparison.comparison.agreements.map((item) => `- ${item}`),
                  "",
                  "Differences",
                  ...comparison.comparison.differences.map(
                    (item) => `- ${item.topic}: ${item.detail}`
                  ),
                  "",
                  "Conflicts",
                  ...comparison.comparison.conflicts.map((item) => `- ${item}`),
                  "",
                  "Missing from one document",
                  ...comparison.comparison.missingFromOneDocument.map((item) => `- ${item}`),
                ].join("\n")}
                label="Copy comparison"
                success="Comparison copied."
              />
            ) : null}
            <Button type="button" variant="secondary" onClick={() => setCompareOpen(false)}>
              Close
            </Button>
          </>
        }
      >
        {aiBusy === "compare" ? (
          <div className="space-y-2.5" aria-live="polite">
            <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--app-muted)" }}>
              <span className="app-spinner" aria-hidden="true" />
              Comparing the selected documents…
            </div>
            <div className="app-skeleton h-4 w-2/5" />
            <div className="app-skeleton h-3 w-full" />
            <div className="app-skeleton h-3 w-11/12" />
          </div>
        ) : comparison ? (
          <div className="space-y-4">
            <p className="app-prose">{comparison.comparison.summary}</p>
            {(
              [
                ["Agreements", comparison.comparison.agreements],
                ["Conflicts", comparison.comparison.conflicts],
                ["Missing from one document", comparison.comparison.missingFromOneDocument],
              ] as const
            ).map(([label, items]) => (
              <div key={label}>
                <p className="app-label">{label}</p>
                {items.length === 0 ? (
                  <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                    None identified.
                  </p>
                ) : (
                  <ul className="mt-1 space-y-1.5">
                    {items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CircleAlert
                          size={13}
                          className="mt-0.5 shrink-0"
                          style={{
                            color:
                              label === "Agreements"
                                ? "var(--app-forest)"
                                : label === "Conflicts"
                                  ? "var(--app-terracotta)"
                                  : "var(--app-gold)",
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-[12px] leading-5">{item}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div>
              <p className="app-label">Differences</p>
              {comparison.comparison.differences.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                  None identified.
                </p>
              ) : (
                <ul className="mt-1 space-y-2">
                  {comparison.comparison.differences.map((difference) => (
                    <li
                      key={`${difference.topic}-${difference.detail}`}
                      className="rounded-md border px-3 py-2.5"
                      style={{ borderColor: "var(--app-line)" }}
                    >
                      <p className="text-[12px] font-semibold">{difference.topic}</p>
                      <p className="mt-1 text-[12px] leading-5">{difference.detail}</p>
                      {difference.documents.length > 0 ? (
                        <p className="mt-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                          {difference.documents.join(" · ")}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <CitationList
              citations={comparison.citations}
              unverifiedCount={comparison.unverifiedCount}
            />
            <div
              className="flex items-center justify-between border-t pt-2.5 text-[10.5px]"
              style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
            >
              <AiMetaNote meta={comparison.meta} />
              <span>Citations checked against each source</span>
            </div>
            <AiContextNote context={comparison.context} />
          </div>
        ) : (
          <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
            Choose two to four documents in the library, then start the comparison.
          </p>
        )}
      </Modal>

      <Modal
        open={uploadOpen}
        onClose={() => {
          if (!uploading) setUploadOpen(false);
        }}
        title="Add a document"
        description="PDF, DOCX, or image · up to 20 MB · extraction and OCR run in this browser"
        footer={
          <>
            {uploading ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => uploadAbort.current?.abort()}
                disabled={uploadStage === "saving"}
              >
                Stop processing
              </Button>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
            )}
            <Button type="button" onClick={submitUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Processing…
                </>
              ) : uploadStage === "failed" ? (
                <>
                  <RefreshCw size={14} aria-hidden="true" />
                  Retry
                </>
              ) : (
                <>
                  <Upload size={14} aria-hidden="true" />
                  Add document
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <div>
            <span className="app-label">File</span>
            <div
              className="rounded-lg border border-dashed px-4 py-5 text-center"
              style={{
                borderColor: uploadFile ? "var(--app-forest)" : "var(--app-line-strong)",
                backgroundColor: "var(--app-panel-soft)",
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const file = event.dataTransfer.files?.[0];
                if (file) validateFile(file);
              }}
            >
              <input
                id="document-file"
                type="file"
                accept={ACCEPTED_FILE_EXTENSIONS.map((extension) => `.${extension}`).join(",")}
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) validateFile(file);
                  event.target.value = "";
                }}
              />
              <label htmlFor="document-file" className="block cursor-pointer">
                <span
                  className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--app-panel-strong)", color: "var(--app-forest)" }}
                >
                  <Upload size={18} aria-hidden="true" />
                </span>
                <span className="mt-2 block text-[12.5px] font-semibold">
                  {uploadFile ? uploadFile.name : "Choose a file or drop it here"}
                </span>
                <span className="mt-0.5 block text-[11px]" style={{ color: "var(--app-muted)" }}>
                  {uploadFile
                    ? `${formatBytes(uploadFile.size)} · ready to add`
                    : "PDF, DOCX, PNG, JPEG, or WebP · 20 MB limit"}
                </span>
              </label>
              {uploadFile ? (
                <button
                  type="button"
                  className="mt-2 text-[11px]"
                  style={{ color: "var(--app-terracotta)" }}
                  onClick={() => {
                    setUploadFile(null);
                    setUploadName("");
                    resetUploadResult();
                  }}
                  disabled={uploading}
                >
                  Remove file
                </button>
              ) : null}
            </div>
          </div>

          <Field label="Document name" htmlFor="document-name" required>
            <Input
              id="document-name"
              value={uploadName}
              onChange={(event) => {
                setUploadName(event.target.value);
                if (uploadError) setUploadError(null);
              }}
              placeholder="e.g. Pilot review notes"
            />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Related project" htmlFor="document-project">
              <Select
                id="document-project"
                value={uploadProject}
                onChange={(event) => setUploadProject(event.target.value)}
              >
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Source label" htmlFor="document-source-kind">
              <Select
                id="document-source-kind"
                value={uploadSourceKind}
                onChange={(event) => setUploadSourceKind(event.target.value as SourceKind)}
              >
                {SOURCE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {uploading || uploadStage === "failed" ? (
            <div
              className="rounded-md border px-3 py-2.5"
              style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex min-w-0 items-center gap-1.5">
                  {uploading ? (
                    <Loader2 size={12} className="shrink-0 animate-spin" aria-hidden="true" />
                  ) : (
                    <CircleAlert
                      size={12}
                      className="shrink-0"
                      style={{ color: "var(--app-terracotta)" }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="truncate">
                    {uploadProgress?.label ??
                      (uploadStage === "failed"
                        ? "Processing stopped. Retry when ready."
                        : "Preparing the file…")}
                  </span>
                </span>
                <span style={{ color: "var(--app-muted)" }}>
                  {Math.round((uploadProgress?.ratio ?? 0) * 100)}%
                </span>
              </div>
              <div
                className="mt-2 h-1.5 overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--app-panel-strong)" }}
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round((uploadProgress?.ratio ?? 0) * 100)}
              >
                <div
                  className="h-full rounded-full transition-[width]"
                  style={{
                    width: `${Math.round((uploadProgress?.ratio ?? 0) * 100)}%`,
                    backgroundColor:
                      uploadStage === "failed" ? "var(--app-terracotta)" : "var(--app-gold)",
                  }}
                />
              </div>
              {uploadProgress?.phase === "ocr" ? (
                <p className="mt-1.5 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                  OCR runs page by page. The first scanned page downloads the recognition engine
                  and language data, so it can take a little longer.
                </p>
              ) : null}
            </div>
          ) : null}

          {uploadError ? (
            <div className="space-y-2">
              <p className="flex items-start gap-1.5 text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
                <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                {uploadError}
              </p>
              {duplicateDoc ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setUploadOpen(false);
                    setTab("documents");
                    setPreviewId(duplicateDoc.id);
                    setPreviewTab("preview");
                    setPageView(1);
                    setPageData(null);
                  }}
                >
                  Open the existing document
                </Button>
              ) : null}
            </div>
          ) : null}

          <div
            className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-[11px] leading-4"
            style={{
              borderColor: "var(--app-line)",
              backgroundColor: "var(--app-panel-soft)",
              color: "var(--app-muted)",
            }}
          >
            <Info size={13} className="mt-0.5 shrink-0" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
            <span>
              Text is extracted in this browser. PDF text layers and DOCX files are read directly;
              scanned pages and document photos go through OCR, with low-confidence lines marked
              for review. Extraction is limited to 50,000 characters. Files are fingerprinted so
              an unchanged document is not processed twice. The original file is uploaded to
              private storage and only your account can read it. AI summary, analysis,
              comparison, and document questions run on demand from the stored text.
            </span>
          </div>
        </div>
      </Modal>
      <Modal
        open={textOpen}
        onClose={() => {
          if (!textSaving) setTextOpen(false);
        }}
        title={textEditingId ? "Edit pasted context" : "Paste context"}
        description="Saved to your private library, indexed for search, and available to the AI workflows for the selected project."
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setTextOpen(false)}
              disabled={textSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submitText} disabled={textSaving}>
              {textSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                <>
                  <FilePlus2 size={14} aria-hidden="true" />
                  {textEditingId ? "Save changes" : "Save context"}
                </>
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="Name" htmlFor="text-source-name" required>
            <Input
              id="text-source-name"
              value={textName}
              onChange={(event) => {
                setTextName(event.target.value);
                if (textError) setTextError(null);
              }}
              placeholder="e.g. Kickoff call notes"
              maxLength={240}
            />
          </Field>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Related project" htmlFor="text-source-project">
              <Select
                id="text-source-project"
                value={textProject}
                onChange={(event) => setTextProject(event.target.value)}
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Source label" htmlFor="text-source-kind">
              <Select
                id="text-source-kind"
                value={textSourceKind}
                onChange={(event) => setTextSourceKind(event.target.value as SourceKind)}
              >
                {SOURCE_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Pasted text"
            htmlFor="text-source-body"
            hint={`Paste notes, an agenda, a transcript, or background context. ${textBody.length.toLocaleString()} / 50,000 characters.`}
            required
          >
            <Textarea
              id="text-source-body"
              rows={10}
              value={textBody}
              onChange={(event) => {
                setTextBody(event.target.value);
                if (textError) setTextError(null);
              }}
              maxLength={50000}
              placeholder="Paste the meeting notes, agenda, transcript, or context here…"
            />
          </Field>
          {textError ? (
            <p
              className="flex items-start gap-1.5 text-[11.5px]"
              style={{ color: "var(--app-terracotta)" }}
              role="alert"
            >
              <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {textError}
            </p>
          ) : null}
        </div>
      </Modal>
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a project"
        description="A project keeps its objective, documents, meetings, decisions, and actions in your account."
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={createProject}>
              <Plus size={14} aria-hidden="true" />
              Create project
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="Project name" htmlFor="project-name" required>
            <Input
              id="project-name"
              value={newProject.name}
              onChange={(event) => {
                setNewProject((current) => ({ ...current, name: event.target.value }));
                if (createError) setCreateError(null);
              }}
              placeholder="e.g. Customer research programme"
            />
          </Field>

          <Field
            label="Description"
            htmlFor="project-description"
            hint="Optional. What the project covers and who it serves."
          >
            <Textarea
              id="project-description"
              rows={3}
              value={newProject.description}
              onChange={(event) =>
                setNewProject((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="Describe the work in a sentence or two."
            />
          </Field>

          <Field label="Objective" htmlFor="project-objective" required>
            <Textarea
              id="project-objective"
              rows={3}
              value={newProject.objective}
              onChange={(event) => {
                setNewProject((current) => ({
                  ...current,
                  objective: event.target.value,
                }));
                if (createError) setCreateError(null);
              }}
              placeholder="What must this project achieve?"
            />
          </Field>

          <Field label="Status" htmlFor="project-status">
            <Select
              id="project-status"
              value={newProject.status}
              onChange={(event) =>
                setNewProject((current) => ({
                  ...current,
                  status: event.target.value as ProjectStatus,
                }))
              }
            >
              <option value="Active">Active</option>
              <option value="In review">In review</option>
              <option value="Paused">Paused</option>
            </Select>
          </Field>

          {createError ? (
            <p
              className="flex items-start gap-1.5 text-[11.5px]"
              style={{ color: "var(--app-terracotta)" }}
              role="alert"
            >
              <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {createError}
            </p>
          ) : null}

          <div
            className="flex items-start gap-2 rounded-md border px-3 py-2.5 text-[11px] leading-4"
            style={{
              borderColor: "var(--app-line)",
              backgroundColor: "var(--app-panel-soft)",
              color: "var(--app-muted)",
            }}
          >
            <Info
              size={13}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--app-gold)" }}
              aria-hidden="true"
            />
            <span>
              Projects are saved to your account and protected by row-level security. Other
              users cannot read or modify them.
            </span>
          </div>
        </div>
      </Modal>
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit project"
        description="Rename the project or update its objective, description, and status."
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void saveProjectEdit()} disabled={editSaving}>
              {editSaving ? (
                <>
                  <span className="app-spinner" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </>
        }
      >
        <div className="space-y-3.5">
          <Field label="Project name" htmlFor="edit-project-name" required>
            <Input
              id="edit-project-name"
              value={editProject.name}
              onChange={(event) => {
                setEditProject((current) => ({ ...current, name: event.target.value }));
                if (editError) setEditError(null);
              }}
            />
          </Field>

          <Field
            label="Description"
            htmlFor="edit-project-description"
            hint="Optional. What the project covers and who it serves."
          >
            <Textarea
              id="edit-project-description"
              rows={3}
              value={editProject.description}
              onChange={(event) =>
                setEditProject((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
          </Field>

          <Field label="Objective" htmlFor="edit-project-objective" required>
            <Textarea
              id="edit-project-objective"
              rows={3}
              value={editProject.objective}
              onChange={(event) => {
                setEditProject((current) => ({
                  ...current,
                  objective: event.target.value,
                }));
                if (editError) setEditError(null);
              }}
            />
          </Field>

          <Field label="Status" htmlFor="edit-project-status">
            <Select
              id="edit-project-status"
              value={editProject.status}
              onChange={(event) =>
                setEditProject((current) => ({
                  ...current,
                  status: event.target.value as ProjectStatus,
                }))
              }
            >
              <option value="Active">Active</option>
              <option value="In review">In review</option>
              <option value="Paused">Paused</option>
            </Select>
          </Field>

          {editError ? (
            <p
              className="flex items-start gap-1.5 text-[11.5px]"
              style={{ color: "var(--app-terracotta)" }}
              role="alert"
            >
              <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
              {editError}
            </p>
          ) : null}
        </div>
      </Modal>
      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title={selectedProject ? `Delete "${selectedProject.name}"?` : "Delete project"}
        description="This removes the project record permanently. It cannot be undone."
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void deleteProjectNow()}
              disabled={deleteSaving}
            >
              {deleteSaving ? (
                <>
                  <span className="app-spinner" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                "Delete project"
              )}
            </Button>
          </>
        }
      >
        {selectedProject ? (
          <div className="space-y-3">
            <ul
              className="space-y-1.5 text-[12px] leading-5"
              style={{ color: "var(--app-ink-soft)" }}
            >
              <li>
                • {projectDocuments(selectedProject).length} documents and{" "}
                {projectMeetings(selectedProject).length} meetings stay in your workspace but are
                no longer assigned to this project.
              </li>
              <li>
                • {selectedProject.decisions.length} decisions and{" "}
                {selectedProject.actions.length} action items filed under this project are
                permanently deleted.
              </li>
              <li>
                • Approved records, preparation briefs, and AI history are kept but lose their
                project link.
              </li>
            </ul>
            {deleteError ? (
              <p
                className="flex items-start gap-1.5 text-[11.5px]"
                style={{ color: "var(--app-terracotta)" }}
                role="alert"
              >
                <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                {deleteError}
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
