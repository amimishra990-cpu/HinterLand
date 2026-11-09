"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CircleAlert,
  Download,
  FileText,
  Loader2,
  MessageCircleQuestion,
  ScanText,
  Search,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CopyButton,
  EmptyState,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from "@/components/app/ui";
import { useToast } from "@/components/app/toast";
import type { KnowledgeRecord } from "@/lib/workspace-types";
import { downloadTextFile, slugify } from "@/lib/download";
import {
  useWorkspace,
  type DocumentPageView,
  type DocumentSearchHit,
} from "@/components/app/workspace-provider";
import { AiMetaNote } from "@/components/app/ai-notice";
import {
  AiRequestError,
  postAi,
  type AiMeta,
} from "@/lib/ai-client";

type KnowledgeAnswerResponse = {
  answer: string;
  insufficientContext: boolean;
  citations: { knowledgeId: string; title: string; kind: string; quote: string }[];
  related: { knowledgeId: string; title: string; reason: string }[];
  retrieved: { id: string; title: string; kind: string; date: string }[];
  retrieval: "keyword" | "recent" | "none";
  meta: AiMeta | null;
  context: {
    recordCount: number;
    approvedRecordCount?: number;
    totalChars?: number;
    unverifiedCitationCount?: number;
  };
};

function typeTone(type: KnowledgeRecord["type"]) {
  if (type === "Meeting record") return "forest" as const;
  if (type === "Decision log") return "navy" as const;
  if (type === "Preparation brief") return "gold" as const;
  return "burgundy" as const;
}

const METHOD_LABELS: Record<string, string> = {
  "pdf-text": "PDF text",
  ocr: "OCR",
  mixed: "Mixed",
  docx: "DOCX",
  image: "Image OCR",
};

function methodLabel(method: string | null) {
  if (!method) return "Unknown method";
  return METHOD_LABELS[method] ?? method;
}

function confidenceLabel(confidence: number | null) {
  if (confidence === null || Number.isNaN(confidence)) return "Confidence unavailable";
  return `${Math.round(confidence * 100)}% confidence`;
}

function monthKey(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function recordToText(record: KnowledgeRecord) {
  return [
    record.title,
    `${record.type} · ${record.date} · ${record.project}`,
    record.meeting ? `Meeting: ${record.meeting}` : "Meeting: Not linked",
    `Topic: ${record.topic}`,
    "",
    record.description,
    "",
    ...record.content,
    "",
    `Related records: ${record.related.join(", ") || "None"}`,
    `Approval: ${record.approved ? "Approved" : "Not approved"}`,
    "",
    "Saved in your Hinterland knowledge repository.",
  ].join("\n");
}

export function KnowledgeWorkspace({
  focusSearch = false,
  initialRecord,
}: {
  focusSearch?: boolean;
  initialRecord?: string;
}) {
  const toast = useToast();
  const { data, searchDocuments, getDocumentPage } = useWorkspace();
  const records = data.knowledge;
  const [query, setQuery] = useState("");
  const [projectFilter, setProjectFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [meetingFilter, setMeetingFilter] = useState("All");
  const [topicFilter, setTopicFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [selectedId, setSelectedId] = useState<string | null>(initialRecord ?? null);

  const [askQuestion, setAskQuestion] = useState("");
  const [askProjectId, setAskProjectId] = useState("");
  const [askBusy, setAskBusy] = useState(false);
  const [askError, setAskError] = useState<string | null>(null);
  const [askResult, setAskResult] = useState<KnowledgeAnswerResponse | null>(null);

  const [docQuery, setDocQuery] = useState("");
  const [docProjectId, setDocProjectId] = useState("");
  const [docBusy, setDocBusy] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docResults, setDocResults] = useState<DocumentSearchHit[]>([]);
  const [docTruncated, setDocTruncated] = useState(false);
  const [docSearched, setDocSearched] = useState(false);
  const [docPageMeta, setDocPageMeta] = useState<{
    documentId: string;
    documentName: string;
    pageNumber: number | null;
  } | null>(null);
  const [docPage, setDocPage] = useState<DocumentPageView | null>(null);
  const [docPageBusy, setDocPageBusy] = useState(false);
  const [docPageError, setDocPageError] = useState<string | null>(null);

  const searchRef = useRef<HTMLInputElement | null>(null);

  const projects = useMemo(
    () => Array.from(new Set(records.map((record) => record.project))),
    [records]
  );
  const types = useMemo(
    () => Array.from(new Set(records.map((record) => record.type))),
    [records]
  );
  const meetings = useMemo(
    () =>
      Array.from(
        new Set(
          records.map((record) => record.meeting).filter(
            (meeting): meeting is string => Boolean(meeting)
          )
        )
      ),
    [records]
  );
  const topics = useMemo(
    () => Array.from(new Set(records.map((record) => record.topic))),
    [records]
  );
  const months = useMemo(
    () =>
      Array.from(new Set(records.map((record) => monthKey(record.date))))
        .filter(Boolean)
        .sort()
        .reverse(),
    [records]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return records.filter((record) => {
      if (
        needle &&
        ![
          record.title,
          record.description,
          record.project,
          record.type,
          record.topic,
          record.meeting ?? "",
          ...record.content,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      ) {
        return false;
      }
      if (projectFilter !== "All" && record.project !== projectFilter) return false;
      if (typeFilter !== "All" && record.type !== typeFilter) return false;
      if (meetingFilter !== "All" && record.meeting !== meetingFilter) return false;
      if (topicFilter !== "All" && record.topic !== topicFilter) return false;
      if (dateFilter !== "All" && monthKey(record.date) !== dateFilter) return false;
      return true;
    });
  }, [records, query, projectFilter, typeFilter, meetingFilter, topicFilter, dateFilter]);

  const filtersActive =
    query.trim() !== "" ||
    projectFilter !== "All" ||
    typeFilter !== "All" ||
    meetingFilter !== "All" ||
    topicFilter !== "All" ||
    dateFilter !== "All";

  const clearFilters = () => {
    setQuery("");
    setProjectFilter("All");
    setTypeFilter("All");
    setMeetingFilter("All");
    setTopicFilter("All");
    setDateFilter("All");
  };

  const askKnowledge = async () => {
    if (!askQuestion.trim()) {
      setAskError("Type a question about your saved records.");
      return;
    }
    setAskBusy(true);
    setAskError(null);
    try {
      const response = await postAi<KnowledgeAnswerResponse>("/api/ai/knowledge", {
        question: askQuestion.trim(),
        projectId: askProjectId || null,
      });
      setAskResult(response);
    } catch (failure) {
      const message =
        failure instanceof AiRequestError
          ? failure.message
          : "The question could not be answered from your knowledge repository.";
      setAskError(message);
      toast(message, "error");
    } finally {
      setAskBusy(false);
    }
  };

  const exportResults = () => {
    if (filtered.length === 0) return;
    const text = filtered.map(recordToText).join("\n\n---\n\n");
    downloadTextFile(
      `${slugify(
        filtersActive ? "hinterland-knowledge-filtered" : "hinterland-knowledge",
        "hinterland-knowledge"
      )}.md`,
      `# Hinterland knowledge export\n\n${
        filtersActive
          ? `Filters were applied. ${filtered.length} of ${records.length} records are included.`
          : `${filtered.length} saved records are included.`
      }\n\n${text}`,
      "text/markdown;charset=utf-8"
    );
    toast(
      `${filtered.length} ${filtered.length === 1 ? "record" : "records"} exported as Markdown.`,
      "success"
    );
  };

  useEffect(() => {
    if (!focusSearch) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, [focusSearch]);

  const selected = records.find((record) => record.id === selectedId) ?? null;
  const selectedProject = data.projects.find(
    (project) =>
      (selected?.projectId && project.id === selected.projectId) ||
      project.name === selected?.project
  );

  const openRelated = (title: string) => {
    const match = records.find((record) => record.title === title);
    if (match) setSelectedId(match.id);
  };

  const relatedExists = (title: string) =>
    records.some((record) => record.title === title);

  const searchSourceDocuments = async () => {
    const trimmed = docQuery.trim();
    if (trimmed.length < 2) {
      setDocError("Enter at least two characters to search extracted document text.");
      return;
    }
    setDocBusy(true);
    setDocError(null);
    try {
      const result = await searchDocuments(trimmed, docProjectId || null);
      if (result.error) {
        setDocError(result.error);
        setDocResults([]);
        setDocTruncated(false);
        return;
      }
      setDocResults(result.results ?? []);
      setDocTruncated(Boolean(result.truncated));
      setDocSearched(true);
    } finally {
      setDocBusy(false);
    }
  };

  const inspectPage = async (hit: DocumentSearchHit) => {
    setDocPageMeta({
      documentId: hit.documentId,
      documentName: hit.documentName,
      pageNumber: hit.pageNumber,
    });
    setDocPage(null);
    setDocPageBusy(true);
    setDocPageError(null);
    const result = await getDocumentPage(hit.documentId, hit.pageNumber ?? 1);
    setDocPageBusy(false);
    if (result.error) {
      setDocPageError(result.error);
      return;
    }
    if (!result.page) {
      setDocPageError(
        "This page was not stored separately. DOCX and older uploads are searchable at document level only."
      );
      return;
    }
    setDocPage(result.page);
  };

  return (
    <>
      <PageHeader
        eyebrow="Knowledge Repository"
        title="Everything you have chosen to keep"
        description="Approved records, preparation briefs, decisions, and refinements live here. Search by project, meeting, topic, type, or date. Only records saved through this workspace appear."
        actions={
          <>
            <Badge tone="forest">Private to you</Badge>
            {filtered.length > 0 ? (
              <Button type="button" variant="secondary" size="sm" onClick={exportResults}>
                <Download size={13} aria-hidden="true" />
                Export results
              </Button>
            ) : null}
            {filtersActive ? (
              <Button type="button" variant="secondary" size="sm" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </>
        }
      />

      <Card className="mb-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-[18px]">Ask your knowledge</h2>
            <p className="mt-0.5 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
              Answers are drawn only from approved records in your account. Each claim cites
              a saved record, and missing context is stated rather than filled in.
            </p>
          </div>
          <Badge tone="gold">AI assisted</Badge>
        </div>

        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(event) => {
            event.preventDefault();
            void askKnowledge();
          }}
        >
          <div className="min-w-0 flex-1">
            <Textarea
              rows={2}
              value={askQuestion}
              onChange={(event) => {
                setAskQuestion(event.target.value);
                if (askError) setAskError(null);
              }}
              placeholder="e.g. What did we decide about the phase-two start date?"
              aria-label="Question about your saved knowledge"
              style={{ minHeight: 58 }}
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-[190px]">
            <Select
              value={askProjectId}
              onChange={(event) => setAskProjectId(event.target.value)}
              aria-label="Restrict the question to one project"
            >
              <option value="">All projects</option>
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={askBusy || !askQuestion.trim()}>
              {askBusy ? (
                <>
                  <span className="app-spinner" aria-hidden="true" />
                  Searching…
                </>
              ) : (
                <>
                  <Sparkles size={14} aria-hidden="true" />
                  Ask
                </>
              )}
            </Button>
          </div>
        </form>

        {askError ? (
          <p className="mt-2 flex items-start gap-1.5 text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
            <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {askError}
          </p>
        ) : null}

        {askBusy ? (
          <div className="mt-4 space-y-2.5" aria-live="polite">
            <div className="app-skeleton h-4 w-1/3" />
            <div className="app-skeleton h-3 w-full" />
            <div className="app-skeleton h-3 w-11/12" />
          </div>
        ) : askResult ? (
          <div className="mt-4">
            {askResult.insufficientContext ? (
              <p
                className="mb-3 flex items-start gap-2 rounded-md px-3 py-2.5 text-[11.5px] leading-5"
                style={{ backgroundColor: "var(--app-gold-soft)", color: "#6f5420" }}
              >
                <MessageCircleQuestion size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                The approved records do not fully answer this question. The response says what
                is missing instead of guessing.
              </p>
            ) : null}

            <p className="app-label">Answer</p>
            <p className="app-prose mt-1.5 whitespace-pre-wrap">{askResult.answer}</p>

            {askResult.citations.length > 0 ? (
              <div className="mt-3">
                <p className="app-label">Sources</p>
                <ul className="mt-1.5 space-y-1.5">
                  {askResult.citations.map((citation) => (
                    <li
                      key={`${citation.knowledgeId}-${citation.quote}`}
                      className="rounded-md border px-2.5 py-2 text-[11.5px] leading-5"
                      style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (records.some((record) => record.id === citation.knowledgeId)) {
                            setSelectedId(citation.knowledgeId);
                          }
                        }}
                        className="text-left font-semibold hover:underline"
                      >
                        {citation.title}
                      </button>
                      <span className="mt-0.5 block" style={{ color: "var(--app-ink-soft)" }}>
                        “{citation.quote}”
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {askResult.related.length > 0 ? (
              <div className="mt-3">
                <p className="app-label">Related records</p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {askResult.related.map((item) => (
                    <button
                      key={item.knowledgeId}
                      type="button"
                      className="app-chip transition-colors hover:border-[color:var(--app-gold)] hover:text-[color:var(--app-forest)]"
                      title={item.reason}
                      onClick={() => {
                        if (records.some((record) => record.id === item.knowledgeId)) {
                          setSelectedId(item.knowledgeId);
                        }
                      }}
                    >
                      {item.title}
                      <ArrowUpRight size={10} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-[10.5px]"
              style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
            >
              <span>
                {askResult.retrieval === "keyword"
                  ? `${askResult.context.recordCount} matching approved record${askResult.context.recordCount === 1 ? "" : "s"}`
                  : askResult.retrieval === "recent"
                    ? `${askResult.context.recordCount} recent approved record${askResult.context.recordCount === 1 ? "" : "s"}`
                    : "No approved records available"}
                {askResult.meta ? (
                  <>
                    {" · "}
                    <AiMetaNote meta={askResult.meta} />
                  </>
                ) : null}
              </span>
              <CopyButton value={askResult.answer} label="Copy answer" success="Answer copied." />
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="p-4 sm:p-5">
        <div className="relative">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
            style={{ color: "var(--app-muted)" }}
            aria-hidden="true"
          />
          <Input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search titles, decisions, actions, projects, or topics…"
            aria-label="Search the knowledge repository"
            style={{ paddingLeft: 34, height: 42 }}
          />
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <SlidersHorizontal size={12} style={{ color: "var(--app-muted)" }} aria-hidden="true" />
          <span className="text-[10px] font-semibold tracking-[0.12em] uppercase" style={{ color: "var(--app-muted)" }}>
            Filters
          </span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
          <Select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            aria-label="Filter by project"
          >
            <option value="All">All projects</option>
            {projects.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </Select>
          <Select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            aria-label="Filter by record type"
          >
            <option value="All">All record types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          <Select
            value={meetingFilter}
            onChange={(event) => setMeetingFilter(event.target.value)}
            aria-label="Filter by meeting"
          >
            <option value="All">All meetings</option>
            {meetings.map((meeting) => (
              <option key={meeting} value={meeting}>
                {meeting}
              </option>
            ))}
          </Select>
          <Select
            value={topicFilter}
            onChange={(event) => setTopicFilter(event.target.value)}
            aria-label="Filter by topic"
          >
            <option value="All">All topics</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </Select>
          <Select
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            aria-label="Filter by date"
            className="col-span-2 sm:col-span-1"
          >
            <option value="All">All dates</option>
            {months.map((month) => (
              <option key={month} value={month}>
                {monthLabel(month)}
              </option>
            ))}
          </Select>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
            {filtered.length} of {records.length} records
            {filtersActive ? " · filters applied" : " · all saved records"}
          </p>
          <p className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
            Your account repository · no other user can read it
          </p>
        </div>
      </Card>

      <Card className="mt-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="font-heading text-[18px]">Search inside source documents</h2>
            <p className="mt-0.5 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
              Full-text search across text extracted from PDFs, scanned pages, photos, and DOCX
              uploads. OCR pages show their confidence, and uncertain text is labelled instead
              of being treated as verified.
            </p>
          </div>
          <Badge tone="navy">Document text</Badge>
        </div>

        <form
          className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start"
          onSubmit={(event) => {
            event.preventDefault();
            void searchSourceDocuments();
          }}
        >
          <div className="relative min-w-0 flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2"
              style={{ color: "var(--app-muted)" }}
              aria-hidden="true"
            />
            <Input
              value={docQuery}
              onChange={(event) => {
                setDocQuery(event.target.value);
                if (docError) setDocError(null);
              }}
              placeholder="e.g. pilot budget, onboarding owner, phase-two start date…"
              aria-label="Search extracted document text"
              style={{ paddingLeft: 34, height: 42 }}
            />
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:w-[190px]">
            <Select
              value={docProjectId}
              onChange={(event) => setDocProjectId(event.target.value)}
              aria-label="Restrict document search to one project"
            >
              <option value="">All projects</option>
              {data.projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              disabled={docBusy || docQuery.trim().length < 2}
            >
              {docBusy ? (
                <>
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                  Searching…
                </>
              ) : (
                <>
                  <Search size={14} aria-hidden="true" />
                  Search documents
                </>
              )}
            </Button>
          </div>
        </form>

        {docError ? (
          <p
            className="mt-2 flex items-start gap-1.5 text-[11.5px]"
            style={{ color: "var(--app-terracotta)" }}
            role="alert"
          >
            <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {docError}
          </p>
        ) : null}

        {docSearched ? (
          <div className="mt-3" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                {docResults.length} matching{" "}
                {docResults.length === 1 ? "result" : "results"} for “{docQuery.trim()}”
              </p>
              {docTruncated ? <Badge tone="gold">Showing the first 20</Badge> : null}
            </div>

            {docResults.length === 0 ? (
              <p
                className="mt-2 rounded-md border px-3 py-2.5 text-[11.5px] leading-5"
                style={{
                  borderColor: "var(--app-line)",
                  backgroundColor: "var(--app-panel-soft)",
                  color: "var(--app-muted)",
                }}
              >
                No extracted document text matches these terms. Try different words, or check
                that the upload finished processing.
              </p>
            ) : (
              <ul className="mt-2 space-y-2">
                {docResults.map((hit) => (
                  <li
                    key={`${hit.documentId}-${hit.pageNumber ?? "doc"}`}
                    className="rounded-md border px-3 py-2.5"
                    style={{
                      borderColor: "var(--app-line)",
                      backgroundColor: "var(--app-panel-soft)",
                    }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-1.5">
                      <span className="inline-flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold">
                        <FileText
                          size={12}
                          className="shrink-0"
                          style={{ color: "var(--app-navy)" }}
                          aria-hidden="true"
                        />
                        <span className="truncate">{hit.documentName}</span>
                        <span className="shrink-0 font-normal" style={{ color: "var(--app-muted)" }}>
                          {hit.pageNumber ? `· page ${hit.pageNumber}` : "· document text"}
                        </span>
                      </span>
                      <span className="flex flex-wrap items-center gap-1">
                        <Badge tone="navy">{methodLabel(hit.extractionMethod)}</Badge>
                        {hit.confidence !== null ? (
                          <Badge tone={hit.confidence < 0.75 ? "terracotta" : "forest"}>
                            {confidenceLabel(hit.confidence)}
                          </Badge>
                        ) : null}
                        {hit.uncertain ? <Badge tone="terracotta">Uncertain text</Badge> : null}
                        {hit.status === "Needs review" ? (
                          <Badge tone="gold">Needs review</Badge>
                        ) : null}
                      </span>
                    </div>

                    <p
                      className="mt-1.5 text-[11.5px] leading-5"
                      style={{ color: "var(--app-ink-soft)" }}
                    >
                      {hit.snippet}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => void inspectPage(hit)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                        style={{ color: "var(--app-forest)" }}
                      >
                        <ScanText size={11} aria-hidden="true" />
                        Inspect extracted page
                      </button>
                      <Link
                        href={`/app/projects?doc=${hit.documentId}`}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold hover:underline"
                        style={{ color: "var(--app-forest)" }}
                      >
                        Open in document library
                        <ArrowUpRight size={10} aria-hidden="true" />
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <p className="mt-3 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
            Search covers only documents you uploaded. Results never include another user’s files.
          </p>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card className="mt-4">
          <EmptyState
            icon={<Search size={18} />}
            title="No saved records match"
            description="Try a broader search, a different project, or another date. The repository only contains records saved to your account."
            action={
              <Button type="button" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {filtered.map((record) => (
            <article key={record.id} className="app-card flex flex-col p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone={typeTone(record.type)}>{record.type}</Badge>
                <span className="inline-flex items-center gap-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                  <CalendarDays size={11} aria-hidden="true" />
                  {record.date}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setSelectedId(record.id)}
                className="mt-2 text-left font-heading text-[17px] leading-snug hover:underline"
              >
                {record.title}
              </button>

              <p className="mt-1 text-[11px]" style={{ color: "var(--app-muted)" }}>
                {record.project} · {record.topic}
                {record.meeting ? ` · ${record.meeting}` : ""}
              </p>

              <p className="mt-2 line-clamp-2 text-[12px] leading-5" style={{ color: "var(--app-ink-soft)" }}>
                {record.description}
              </p>

              <p className="mt-2 line-clamp-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                Related: {record.related.join(", ") || "None"}
              </p>

              <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                <Badge tone={record.approved ? "forest" : "gold"}>
                  {record.approved ? "Approved" : "Not approved"}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setSelectedId(record.id)}
                >
                  Open record
                  <ArrowUpRight size={12} aria-hidden="true" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-md border px-3.5 py-3 text-[11.5px] leading-5" style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)", color: "var(--app-muted)" }}>
        <BookOpen size={14} className="mt-0.5 shrink-0" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
        <span>
          Every record here is stored in your account and protected by row-level security.
          Records saved from preparation, communication, and meeting intelligence appear in
          this repository.
        </span>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelectedId(null)}
        title={selected?.title ?? "Knowledge record"}
        description={
          selected
            ? `${selected.type} · ${selected.date} · ${selected.project}`
            : undefined
        }
        size="lg"
        footer={
          selected ? (
            <>
              {selectedProject ? (
                <Link
                  href={`/app/projects?project=${selectedProject.id}`}
                  className="app-btn app-btn-secondary app-btn-sm"
                >
                  Open project
                </Link>
              ) : null}
              <CopyButton
                value={recordToText(selected)}
                label="Copy record"
                success="Knowledge record copied."
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  downloadTextFile(
                    `${slugify(selected.title, "knowledge-record")}.md`,
                    recordToText(selected),
                    "text/markdown;charset=utf-8"
                  );
                  toast("Knowledge record exported as Markdown.", "success");
                }}
              >
                <Download size={13} aria-hidden="true" />
                Export record
              </Button>
              <Button type="button" onClick={() => setSelectedId(null)}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        {selected ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={typeTone(selected.type)}>{selected.type}</Badge>
              <Badge tone={selected.approved ? "forest" : "gold"}>
                {selected.approved ? "Approved" : "Not approved"}
              </Badge>
              <span className="text-[11px]" style={{ color: "var(--app-muted)" }}>
                {selected.project} · {selected.topic}
                {selected.meeting ? ` · ${selected.meeting}` : ""}
              </span>
            </div>

            <p className="app-prose mt-3">{selected.description}</p>

            <div className="app-rule my-4" />

            <p className="app-label">Saved content</p>
            <ul className="mt-2 space-y-2">
              {selected.content.map((line) => (
                <li
                  key={line}
                  className="rounded-md border px-3 py-2.5 text-[12.5px] leading-5"
                  style={{
                    borderColor: "var(--app-line)",
                    backgroundColor: line.toLowerCase().startsWith("decision")
                      ? "var(--app-forest-soft)"
                      : line.toLowerCase().startsWith("open question")
                        ? "var(--app-terracotta-soft)"
                        : "var(--app-panel-soft)",
                  }}
                >
                  {line}
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <p className="app-label">Related records</p>
              {selected.related.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
                  No related records.
                </p>
              ) : (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selected.related.map((title) =>
                    relatedExists(title) ? (
                      <button
                        key={title}
                        type="button"
                        onClick={() => openRelated(title)}
                        className="app-chip transition-colors hover:border-[color:var(--app-gold)] hover:text-[color:var(--app-forest)]"
                      >
                        {title}
                        <ArrowUpRight size={10} aria-hidden="true" />
                      </button>
                    ) : (
                      <span key={title} className="app-chip" title="Referenced source, not a saved knowledge record">
                        {title}
                      </span>
                    )
                  )}
                </div>
              )}
            </div>

            <p className="mt-4 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
              This record is stored in your account and is only visible to you.
            </p>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(docPageMeta)}
        onClose={() => {
          setDocPageMeta(null);
          setDocPage(null);
          setDocPageError(null);
        }}
        title={
          docPageMeta
            ? docPageMeta.pageNumber
              ? `${docPageMeta.documentName} · page ${docPageMeta.pageNumber}`
              : docPageMeta.documentName
            : "Extracted page"
        }
        description="Text stored for this page during document processing"
        size="lg"
        footer={
          <>
            {docPageMeta ? (
              <Link
                href={`/app/projects?doc=${docPageMeta.documentId}`}
                className="app-btn app-btn-secondary app-btn-sm"
              >
                Open document
              </Link>
            ) : null}
            <Button
              type="button"
              onClick={() => {
                setDocPageMeta(null);
                setDocPage(null);
                setDocPageError(null);
              }}
            >
              Close
            </Button>
          </>
        }
      >
        {docPageBusy ? (
          <div className="space-y-2.5" aria-live="polite">
            <div className="app-skeleton h-4 w-1/3" />
            <div className="app-skeleton h-3 w-full" />
            <div className="app-skeleton h-3 w-11/12" />
            <div className="app-skeleton h-3 w-4/5" />
          </div>
        ) : docPageError ? (
          <p
            className="flex items-start gap-1.5 text-[12px] leading-5"
            style={{ color: "var(--app-terracotta)" }}
            role="alert"
          >
            <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            {docPageError}
          </p>
        ) : docPage ? (
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge tone="navy">{methodLabel(docPage.extractionMethod)}</Badge>
              {docPage.confidence !== null ? (
                <Badge tone={docPage.confidence < 0.75 ? "terracotta" : "forest"}>
                  {confidenceLabel(docPage.confidence)}
                </Badge>
              ) : null}
              {docPage.uncertain ? <Badge tone="terracotta">Contains uncertain text</Badge> : null}
              {docPage.duplicateOf ? (
                <Badge tone="gold">Duplicate of page {docPage.duplicateOf}</Badge>
              ) : null}
              {docPage.rotationApplied ? (
                <Badge tone="neutral">Rotated {docPage.rotationApplied}° for OCR</Badge>
              ) : null}
            </div>

            {docPage.uncertain ? (
              <p
                className="mt-3 flex items-start gap-2 rounded-md px-3 py-2.5 text-[11.5px] leading-5"
                style={{ backgroundColor: "var(--app-terracotta-soft)", color: "#7a3b26" }}
              >
                <CircleAlert size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
                Some lines on this page were recognised with low confidence. Verify them against
                the original file before relying on the text.
              </p>
            ) : null}

            {docPage.uncertainLines.length > 0 ? (
              <div className="mt-3">
                <p className="app-label">Low-confidence lines</p>
                <ul className="mt-1.5 space-y-1">
                  {docPage.uncertainLines.slice(0, 12).map((line, index) => (
                    <li
                      key={`${index}-${line}`}
                      className="rounded-md border px-2.5 py-1.5 text-[11.5px] leading-5"
                      style={{
                        borderColor: "var(--app-line)",
                        backgroundColor: "var(--app-terracotta-soft)",
                      }}
                    >
                      {line}
                    </li>
                  ))}
                </ul>
                {docPage.uncertainLines.length > 12 ? (
                  <p className="mt-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                    {docPage.uncertainLines.length - 12} further low-confidence line
                    {docPage.uncertainLines.length - 12 === 1 ? "" : "s"} not shown.
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="mt-3">
              <p className="app-label">Extracted text</p>
              <pre
                className="mt-1.5 max-h-[46vh] overflow-auto rounded-md border px-3 py-2.5 text-[12px] leading-5 whitespace-pre-wrap"
                style={{
                  borderColor: "var(--app-line)",
                  backgroundColor: "var(--app-panel-soft)",
                  fontFamily: "var(--app-font-body)",
                }}
              >
                {docPage.text.trim() || "No text could be extracted for this page."}
              </pre>
            </div>

            <p className="mt-3 text-[10.5px] leading-5" style={{ color: "var(--app-muted)" }}>
              This is machine-extracted text, not the original page image. Page-level text is
              stored only for your account and is used to ground AI answers with citations.
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
