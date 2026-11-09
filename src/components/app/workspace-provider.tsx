"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import type {
  ProjectStatus,
  SourceKind,
  WorkspacePayload,
  WorkspaceProfile,
  WritingPreferences,
} from "@/lib/workspace-types";

export type MutationResult = {
  ok: boolean;
  error?: string;
  id?: string;
  status?: string;
  existingDocumentId?: string;
};

export type UploadPage = {
  pageNumber: number;
  text: string;
  extractionMethod: "pdf-text" | "ocr" | "docx" | "image";
  confidence: number | null;
  uncertain: boolean;
  uncertainLines: string[];
  rotationApplied: number | null;
  duplicateOf: number | null;
};

export type UploadDocumentMeta = {
  name: string;
  projectId: string;
  extractedText: string;
  pageCount: number | null;
  extractionMethod: string | null;
  extractionConfidence: number | null;
  extractionQuality: unknown;
  contentHash: string | null;
  mimeType: string;
  pages: UploadPage[];
  sourceKind: SourceKind;
};

export type DocumentLookup = {
  id: string;
  name: string;
  status: string;
  fileType: string;
  pageCount: number | null;
  uploadedAt: string;
};

export type DocumentPageView = {
  pageNumber: number;
  text: string;
  extractionMethod: string;
  confidence: number | null;
  uncertain: boolean;
  uncertainLines: string[];
  rotationApplied: number | null;
  duplicateOf: number | null;
};

export type DocumentSearchHit = {
  documentId: string;
  documentName: string;
  projectId: string | null;
  fileType: string;
  status: string;
  pageNumber: number | null;
  snippet: string;
  confidence: number | null;
  uncertain: boolean;
  extractionMethod: string | null;
};

export type NewKnowledgeInput = {
  title: string;
  type: "Meeting record" | "Decision log" | "Preparation brief" | "Refinement";
  projectId?: string | null;
  meetingId?: string | null;
  meetingTitle?: string | null;
  meetingDate?: string | null;
  topic: string;
  description: string;
  content: string[];
  related: string[];
  approved: boolean;
  preparation?: { objective: string; brief: unknown };
  meetingRecord?: { summary: string };
};

type WorkspaceContextValue = {
  data: WorkspacePayload;
  profile: WorkspaceProfile;
  refreshing: boolean;
  error: string | null;
  refresh: () => Promise<MutationResult>;
  updateProfile: (input: {
    fullName: string;
    role?: string;
    notificationPreferences?: WorkspaceProfile["notificationPreferences"];
  }) => Promise<MutationResult>;
  createProject: (input: {
    name: string;
    description: string;
    objective: string;
    status: "Active" | "In review" | "Paused";
  }) => Promise<MutationResult>;
  updateProject: (
    id: string,
    input: {
      name?: string;
      description?: string;
      objective?: string;
      status?: ProjectStatus;
      archived?: boolean;
    }
  ) => Promise<MutationResult>;
  deleteProject: (id: string) => Promise<MutationResult>;
  toggleAction: (id: string, done: boolean) => Promise<MutationResult>;
  uploadDocument: (file: File, meta: UploadDocumentMeta) => Promise<MutationResult>;
  findDocumentByHash: (
    hash: string
  ) => Promise<{ document?: DocumentLookup | null; error?: string }>;
  getDocumentPage: (
    id: string,
    page: number
  ) => Promise<{ page?: DocumentPageView | null; error?: string }>;
  searchDocuments: (
    query: string,
    projectId?: string | null
  ) => Promise<{ results?: DocumentSearchHit[]; truncated?: boolean; error?: string }>;
  deleteDocument: (id: string) => Promise<MutationResult>;
  addTextSource: (input: {
    name: string;
    text: string;
    projectId: string | null;
    sourceKind: SourceKind;
  }) => Promise<MutationResult>;
  updateDocument: (
    id: string,
    input: {
      name?: string;
      text?: string;
      projectId?: string | null;
      sourceKind?: SourceKind;
    }
  ) => Promise<MutationResult>;
  getDownloadUrl: (id: string) => Promise<{ url?: string; error?: string }>;
  createKnowledge: (input: NewKnowledgeInput) => Promise<MutationResult>;
  approveKnowledge: (id: string, approved: boolean) => Promise<MutationResult>;
  saveWritingPreferences: (preferences: WritingPreferences) => Promise<MutationResult>;
  addWritingExample: (input: {
    title: string;
    context: string;
    excerpt: string;
  }) => Promise<MutationResult>;
  removeWritingExample: (id: string) => Promise<MutationResult>;
  resetWorkspace: () => Promise<MutationResult>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function messageFrom(body: unknown, fallback: string) {
  if (body && typeof body === "object" && "error" in body) {
    const message = (body as { error?: unknown }).error;
    if (typeof message === "string" && message) return message;
  }
  return fallback;
}

async function requestJson(
  input: string,
  init?: RequestInit
): Promise<{ body: unknown; status: number }> {
  const response = await fetch(input, {
    ...init,
    credentials: "same-origin",
    headers:
      init?.body instanceof FormData
        ? init?.headers
        : { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = await response.json().catch(() => null);
  return { body, status: response.status };
}

export function WorkspaceProvider({
  initialData,
  children,
}: {
  initialData: WorkspacePayload;
  children: ReactNode;
}) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);

  const handleAuthFailure = useCallback(() => {
    router.replace("/login?reason=session-expired");
  }, [router]);

  const refresh = useCallback(async (): Promise<MutationResult> => {
    if (busy.current) return { ok: false, error: "A save is already in progress." };
    busy.current = true;
    setRefreshing(true);
    try {
      const { body, status } = await requestJson("/api/workspace");
      if (status === 401) {
        handleAuthFailure();
        return { ok: false, error: "Your session expired. Sign in again." };
      }
      if (status === 503) {
        return {
          ok: false,
          error: messageFrom(body, "Supabase is not configured."),
        };
      }
      if (status !== 200 || !body) {
        return {
          ok: false,
          error: messageFrom(body, "Workspace data could not be refreshed."),
        };
      }
      setData(body as WorkspacePayload);
      setError(null);
      return { ok: true };
    } catch {
      return { ok: false, error: "The workspace could not be reached. Check your connection." };
    } finally {
      busy.current = false;
      setRefreshing(false);
    }
  }, [handleAuthFailure]);

  const mutate = useCallback(
    async (input: string, init: RequestInit): Promise<MutationResult> => {
      if (busy.current) return { ok: false, error: "A save is already in progress." };
      busy.current = true;
      setRefreshing(true);
      try {
        const { body, status } = await requestJson(input, init);
        if (status === 401) {
          handleAuthFailure();
          return { ok: false, error: "Your session expired. Sign in again." };
        }
        if (status < 200 || status >= 300) {
          const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
          return {
            ok: false,
            error: messageFrom(body, "The change could not be saved."),
            existingDocumentId:
              typeof payload?.existingDocumentId === "string"
                ? payload.existingDocumentId
                : undefined,
          };
        }
        const payload = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
        const refreshed = await requestJson("/api/workspace");
        if (refreshed.status === 401) {
          handleAuthFailure();
          return { ok: false, error: "Your session expired. Sign in again." };
        }
        if (refreshed.status === 200 && refreshed.body) {
          setData(refreshed.body as WorkspacePayload);
        }
        setError(null);
        return {
          ok: true,
          id: typeof payload?.id === "string" ? payload.id : undefined,
          status: typeof payload?.status === "string" ? payload.status : undefined,
        };
      } catch {
        return { ok: false, error: "The workspace could not be reached. Check your connection." };
      } finally {
        busy.current = false;
        setRefreshing(false);
      }
    },
    [handleAuthFailure]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      data,
      profile: data.profile,
      refreshing,
      error,
      refresh,
      updateProfile: (input) =>
        mutate("/api/profile", { method: "PATCH", body: JSON.stringify(input) }),
      createProject: (input) =>
        mutate("/api/projects", { method: "POST", body: JSON.stringify(input) }),
      updateProject: (id, input) =>
        mutate(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
      deleteProject: (id) => mutate(`/api/projects/${id}`, { method: "DELETE" }),
      toggleAction: (id, done) =>
        mutate(`/api/actions/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ done }),
        }),
      uploadDocument: (file, meta) => {
        const body = new FormData();
        body.set("file", file);
        body.set("name", meta.name);
        body.set("projectId", meta.projectId);
        body.set("extractedText", meta.extractedText);
        body.set("pageCount", meta.pageCount === null ? "" : String(meta.pageCount));
        body.set("extractionMethod", meta.extractionMethod ?? "");
        body.set(
          "extractionConfidence",
          meta.extractionConfidence === null ? "" : String(meta.extractionConfidence)
        );
        body.set("extractionQuality", JSON.stringify(meta.extractionQuality ?? {}));
        body.set("contentHash", meta.contentHash ?? "");
        body.set("mimeType", meta.mimeType);
        body.set("pages", JSON.stringify(meta.pages));
        body.set("sourceKind", meta.sourceKind);
        return mutate("/api/documents", { method: "POST", body });
      },
      findDocumentByHash: async (hash) => {
        const { body, status } = await requestJson(
          `/api/documents/lookup?hash=${encodeURIComponent(hash)}`
        );
        if (status === 401) {
          handleAuthFailure();
          return { error: "Your session expired. Sign in again." };
        }
        if (status !== 200 || !body || typeof body !== "object") {
          return { error: messageFrom(body, "The document library could not be checked.") };
        }
        const document = (body as { document?: unknown }).document;
        return { document: (document as DocumentLookup | null) ?? null };
      },
      getDocumentPage: async (id, page) => {
        const { body, status } = await requestJson(
          `/api/documents/${id}/pages?page=${page}`
        );
        if (status === 401) {
          handleAuthFailure();
          return { error: "Your session expired. Sign in again." };
        }
        if (status !== 200 || !body || typeof body !== "object") {
          return { error: messageFrom(body, "The page could not be loaded.") };
        }
        const record = (body as { page?: unknown }).page;
        return { page: (record as DocumentPageView | null) ?? null };
      },
      searchDocuments: async (query, projectFilter) => {
        const params = new URLSearchParams({ q: query });
        if (projectFilter) params.set("projectId", projectFilter);
        const { body, status } = await requestJson(`/api/documents/search?${params}`);
        if (status === 401) {
          handleAuthFailure();
          return { error: "Your session expired. Sign in again." };
        }
        if (status !== 200 || !body || typeof body !== "object") {
          return { error: messageFrom(body, "Document text could not be searched.") };
        }
        const payload = body as { results?: unknown; truncated?: unknown };
        return {
          results: Array.isArray(payload.results) ? (payload.results as DocumentSearchHit[]) : [],
          truncated: Boolean(payload.truncated),
        };
      },
      deleteDocument: (id) => mutate(`/api/documents/${id}`, { method: "DELETE" }),
      addTextSource: (input) =>
        mutate("/api/documents/text", { method: "POST", body: JSON.stringify(input) }),
      updateDocument: (id, input) =>
        mutate(`/api/documents/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
      getDownloadUrl: async (id) => {
        const { body, status } = await requestJson(`/api/documents/${id}/download`);
        if (status === 401) {
          handleAuthFailure();
          return { error: "Your session expired. Sign in again." };
        }
        if (status !== 200 || !body || typeof body !== "object") {
          return { error: messageFrom(body, "The download link could not be created.") };
        }
        const url = (body as { url?: unknown }).url;
        return typeof url === "string" ? { url } : { error: "The download link was invalid." };
      },
      createKnowledge: (input) =>
        mutate("/api/knowledge", { method: "POST", body: JSON.stringify(input) }),
      approveKnowledge: (id, approved) =>
        mutate(`/api/knowledge/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ approved }),
        }),
      saveWritingPreferences: (preferences) =>
        mutate("/api/writing/preferences", {
          method: "PATCH",
          body: JSON.stringify(preferences),
        }),
      addWritingExample: (input) =>
        mutate("/api/writing/examples", {
          method: "POST",
          body: JSON.stringify(input),
        }),
      removeWritingExample: (id) =>
        mutate(`/api/writing/examples/${id}`, { method: "DELETE" }),
      resetWorkspace: () =>
        mutate("/api/workspace/reset", { method: "POST", body: JSON.stringify({}) }),
    }),
    [data, error, handleAuthFailure, mutate, refresh, refreshing]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace must be used inside WorkspaceProvider");
  }
  return context;
}
