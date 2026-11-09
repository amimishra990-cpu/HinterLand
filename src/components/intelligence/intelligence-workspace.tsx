"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Download,
  FileText,
  Info,
  MessageCircleQuestion,
  NotebookPen,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  ShieldCheck,
  Trash2,
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
  PageHeader,
  Select,
  Tabs,
  Textarea,
} from "@/components/app/ui";
import {
  type ExtractedAction,
  type MeetingRecordResult,
} from "@/lib/ai/result-types";
import { useWorkspace } from "@/components/app/workspace-provider";
import { AiContextNote, AiMetaNote } from "@/components/app/ai-notice";
import {
  AiRequestError,
  postAi,
  type AiContextSummary,
  type AiMeta,
} from "@/lib/ai-client";

type ValidationItem = {
  index: number;
  text: string;
  evidence: string | null;
  verified: boolean;
};

type ValidationAction = {
  index: number;
  task: string;
  owner: string | null;
  due: string | null;
  evidence: string | null;
  evidenceVerified: boolean;
  ownerSpecified: boolean;
  dueSpecified: boolean;
  ownerVerified: boolean;
  dueVerified: boolean;
};

type IntelligenceValidation = {
  decisions: ValidationItem[];
  discussion: ValidationItem[];
  actions: ValidationAction[];
  blocked: boolean;
  ownerOrDeadlineBlanked: boolean;
};

type IntelligenceResponse = {
  record: MeetingRecordResult;
  validation: IntelligenceValidation;
  meta: AiMeta;
  context: AiContextSummary;
};

type FormState = {
  title: string;
  date: string;
  project: string;
  source: "Notes" | "Transcript";
  notes: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  date: "",
  project: "",
  source: "Notes",
  notes: "",
};

function displayDate(value: string) {
  if (!value) return "Date not stated";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function recordToText(
  title: string,
  date: string,
  project: string,
  record: MeetingRecordResult
) {
  const actionLines =
    record.actions.length > 0
      ? record.actions.map(
          (action, index) =>
            `${index + 1}. ${action.task} | Owner: ${action.owner ?? "Not specified"} | Deadline: ${action.due ?? "Not specified"}`
        )
      : ["No action items were identified."];

  return [
    `# ${title || "Meeting record"}`,
    "",
    `Date: ${displayDate(date)}`,
    `Project: ${project || "Not specified"}`,
    "",
    "## Executive summary",
    record.summary,
    "",
    "## Key discussion points",
    ...(record.discussion.length > 0 ? record.discussion.map((item) => `- ${item}`) : ["- None identified."]),
    "",
    "## Decisions",
    ...(record.decisions.length > 0 ? record.decisions.map((item) => `- ${item}`) : ["- No confirmed decisions appear in the notes."]),
    "",
    "## Unresolved questions",
    ...(record.questions.length > 0 ? record.questions.map((item) => `- ${item}`) : ["- None identified."]),
    "",
    "## Action items",
    ...actionLines,
    "",
    "Owners and deadlines are recorded only where the source states them. Generated with AI assistance and reviewed by you before saving.",
  ].join("\n");
}

export function IntelligenceWorkspace() {
  const toast = useToast();
  const { data, createKnowledge } = useWorkspace();
  const { projects, meetings } = data;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [consent, setConsent] = useState(false);
  const [record, setRecord] = useState<MeetingRecordResult | null>(null);
  const [validation, setValidation] = useState<IntelligenceValidation | null>(null);
  const [meta, setMeta] = useState<AiMeta | null>(null);
  const [context, setContext] = useState<AiContextSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("summary");
  const [editing, setEditing] = useState(false);
  const [approved, setApproved] = useState(false);
  const [flagsAcknowledged, setFlagsAcknowledged] = useState(false);
  const [edited, setEdited] = useState(false);
  const [saved, setSaved] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editSummary, setEditSummary] = useState("");
  const [editDiscussion, setEditDiscussion] = useState("");
  const [editDecisions, setEditDecisions] = useState("");
  const [editQuestions, setEditQuestions] = useState("");
  const [editActions, setEditActions] = useState<ExtractedAction[]>([]);

  const runExtract = async (value: FormState) => {
    setLoading(true);
    setRecord(null);
    setValidation(null);
    setMeta(null);
    setContext(null);
    setEditing(false);
    setApproved(false);
    setFlagsAcknowledged(false);
    setEdited(false);
    setSaved(false);
    setStale(false);
    setError(null);

    try {
      const response = await postAi<IntelligenceResponse>("/api/ai/intelligence", {
        title: value.title.trim(),
        date: value.date,
        projectId: value.project || null,
        notes: value.notes,
        sourceKind: value.source,
        consent,
      });
      setRecord(response.record);
      setValidation(response.validation);
      setMeta(response.meta);
      setContext(response.context);
      setTab("summary");
      toast("Draft record generated. Review the flagged items before approving.", "success");
    } catch (failure) {
      const message =
        failure instanceof AiRequestError
          ? failure.message
          : "The record could not be generated.";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    if (record) {
      setStale(true);
      if (approved) {
        setApproved(false);
        setSaved(false);
      }
    }
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.title.trim()) {
      setError("Add a meeting title so the record can be identified.");
      toast("Add a meeting title first.", "error");
      return;
    }
    if (!form.notes.trim()) {
      setError("Add the meeting notes or transcript before generating a record.");
      toast("Add notes or a transcript first.", "error");
      return;
    }
    if (form.source === "Transcript" && !consent) {
      setError("Confirm that participants were informed before using a transcript.");
      toast("Recording consent must be confirmed first.", "error");
      return;
    }
    void runExtract(form);
  };

  const clearAll = () => {
    setForm(EMPTY_FORM);
    setConsent(false);
    setRecord(null);
    setValidation(null);
    setMeta(null);
    setContext(null);
    setEditing(false);
    setApproved(false);
    setFlagsAcknowledged(false);
    setEdited(false);
    setSaved(false);
    setStale(false);
    setError(null);
    toast("Record editor cleared.", "info");
  };

  const startEditing = () => {
    if (!record) return;
    if (approved) {
      setApproved(false);
      toast("Editing removed the approval. Approve the record again before saving.", "info");
    }
    setEditSummary(record.summary);
    setEditDiscussion(record.discussion.join("\n"));
    setEditDecisions(record.decisions.join("\n"));
    setEditQuestions(record.questions.join("\n"));
    setEditActions(record.actions.map((action) => ({ ...action })));
    setEditing(true);
    setTab("summary");
  };

  const lines = (value: string) =>
    value
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "").trim())
      .filter(Boolean);

  const saveEdits = () => {
    if (!record) return;
    const next: MeetingRecordResult = {
      ...record,
      summary: editSummary.trim() || record.summary,
      discussion: lines(editDiscussion),
      decisions: lines(editDecisions),
      questions: lines(editQuestions),
      actions: editActions
        .map((action) => ({
          task: action.task.trim(),
          owner: action.owner?.trim() ? action.owner.trim() : null,
          due: action.due?.trim() ? action.due.trim() : null,
        }))
        .filter((action) => action.task.length > 0),
    };
    setRecord(next);
    setEditing(false);
    setEdited(true);
    setValidation(null);
    setApproved(false);
    setFlagsAcknowledged(false);
    setSaved(false);
    toast("Edits applied. Grounding flags were cleared because the content is now yours. Approve again before saving.", "success");
  };

  const rejectDraft = () => {
    if (!record) return;
    setRecord(null);
    setValidation(null);
    setMeta(null);
    setContext(null);
    setEditing(false);
    setApproved(false);
    setFlagsAcknowledged(false);
    setEdited(false);
    setSaved(false);
    setStale(false);
    setTab("summary");
    toast("Draft rejected and removed. The source notes are kept.", "info");
  };

  const saveRecord = async () => {
    if (!record || !approved) return;
    const result = await createKnowledge({
      title: `${form.title.trim() || "Meeting"} — meeting record`,
      type: "Meeting record",
      projectId: form.project || null,
      meetingId: meetings.find((meeting) => meeting.title === form.title.trim())?.id ?? null,
      meetingTitle: form.title.trim() || null,
      meetingDate: form.date || null,
      topic: "Meeting record",
      description: record.summary,
      content: [
        ...record.discussion.map((item) => `Discussion: ${item}`),
        ...record.decisions.map((item) => `Decision: ${item}`),
        ...record.questions.map((item) => `Open question: ${item}`),
        ...record.actions.map(
          (action) =>
            `Action: ${action.task}. Owner: ${action.owner ?? "Not specified"}. Due: ${action.due ?? "Not specified"}.`
        ),
      ],
      related: [],
      approved: true,
      meetingRecord: { summary: record.summary },
    });
    if (!result.ok) {
      toast(result.error ?? "The record could not be saved.", "error");
      return;
    }
    setSaved(true);
    toast("Approved record saved to your knowledge repository.", "success");
  };

  const exportRecord = () => {
    if (!record) return;
    const project =
      projects.find((entry) => entry.id === form.project)?.name ?? "No project";
    const text = recordToText(form.title, form.date, project, record);
    const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const slug = (form.title || "meeting-record")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    anchor.href = url;
    anchor.download = `${slug || "meeting-record"}.md`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast("Approved record exported as a Markdown file.", "success");
  };

  const tabs = useMemo(
    () =>
      record
        ? [
            { value: "summary", label: "Summary" },
            { value: "discussion", label: "Discussion", count: record.discussion.length },
            { value: "decisions", label: "Decisions", count: record.decisions.length },
            { value: "questions", label: "Questions", count: record.questions.length },
            { value: "actions", label: "Actions", count: record.actions.length },
          ]
        : [],
    [record]
  );

  const projectName =
    projects.find((entry) => entry.id === form.project)?.name ?? "No project";

  const fullText = record
    ? recordToText(form.title, form.date, projectName, record)
    : "";

  const unverifiedDecisions =
    validation?.decisions.filter((item) => !item.verified).length ?? 0;
  const unverifiedActions =
    validation?.actions.filter(
      (item) => !item.evidenceVerified || (item.ownerSpecified && !item.ownerVerified) || (item.dueSpecified && !item.dueVerified)
    ).length ?? 0;
  const needsAcknowledgement = Boolean(
    validation && (validation.blocked || validation.ownerOrDeadlineBlanked)
  );
  const canApprove = !needsAcknowledgement || flagsAcknowledged;
  const flaggedSummary = [
    unverifiedDecisions > 0
      ? `${unverifiedDecisions} decision${unverifiedDecisions === 1 ? "" : "s"} without a matching quote`
      : "",
    unverifiedActions > 0
      ? `${unverifiedActions} action${unverifiedActions === 1 ? "" : "s"} with details not found in the notes`
      : "",
    validation?.ownerOrDeadlineBlanked && unverifiedActions === 0
      ? "an owner or deadline was removed because the notes do not state it"
      : "",
  ]
    .filter(Boolean)
    .join("; ");

  return (
    <>
      <PageHeader
        eyebrow="Meeting Intelligence"
        title="Turn notes into a reviewed record"
        description="Structure the notes without filling gaps. The record separates confirmed decisions from open questions, and every owner or deadline must come from the source text."
        actions={
          <>
            <Button type="button" variant="ghost" onClick={clearAll}>
              Clear
            </Button>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <form onSubmit={onSubmit} className="xl:col-span-5">
          <Card className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-heading text-[18px]">Source material</h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                  Notes or a consented transcript, nothing more.
                </p>
              </div>
              <Badge tone="forest">Private to you</Badge>
            </div>

            <div className="mt-4 space-y-3.5">
              <Field label="Meeting title" htmlFor="intel-title" required>
                <Input
                  id="intel-title"
                  value={form.title}
                  onChange={(event) => {
                    update("title", event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="e.g. Pilot review"
                  aria-invalid={Boolean(error) && !form.title.trim()}
                />
              </Field>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <Field label="Date" htmlFor="intel-date">
                  <Input
                    id="intel-date"
                    type="date"
                    value={form.date}
                    onChange={(event) => update("date", event.target.value)}
                  />
                </Field>
                <Field label="Related project" htmlFor="intel-project">
                  <Select
                    id="intel-project"
                    value={form.project}
                    onChange={(event) => update("project", event.target.value)}
                  >
                    <option value="">No project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <Field label="Source type" htmlFor="intel-source">
                <Select
                  id="intel-source"
                  value={form.source}
                  onChange={(event) =>
                    update("source", event.target.value as FormState["source"])
                  }
                >
                  <option value="Notes">Meeting notes</option>
                  <option value="Transcript">Recording transcript</option>
                </Select>
              </Field>

              {form.source === "Transcript" ? (
                <label
                  className="flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5"
                  style={{
                    borderColor: consent ? "var(--app-line)" : "rgba(163, 90, 60, .45)",
                    backgroundColor: consent ? "var(--app-panel-soft)" : "var(--app-terracotta-soft)",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(event) => setConsent(event.target.checked)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[color:var(--app-forest)]"
                  />
                  <span className="text-[11.5px] leading-5">
                    I confirm that participants were informed that the meeting would be
                    recorded or transcribed, and that this material may be used here.
                  </span>
                </label>
              ) : null}

              <Field
                label="Meeting notes or transcript"
                htmlFor="intel-notes"
                required
                hint={`${form.notes.trim().split(/\s+/).filter(Boolean).length} words`}
              >
                <Textarea
                  id="intel-notes"
                  rows={12}
                  value={form.notes}
                  onChange={(event) => {
                    update("notes", event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste the notes here. Owners and dates are only recorded when they appear in this text."
                  aria-invalid={Boolean(error) && !form.notes.trim()}
                />
              </Field>
            </div>

            {error ? (
              <p
                className="mt-3 flex items-start gap-1.5 text-[11.5px]"
                style={{ color: "var(--app-terracotta)" }}
                role="alert"
              >
                <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="app-spinner" aria-hidden="true" />
                    Structuring…
                  </>
                ) : (
                  <>
                    <NotebookPen size={14} aria-hidden="true" />
                    Generate record
                  </>
                )}
              </Button>
            </div>

            <div
              className="mt-4 flex items-start gap-2 rounded-md border px-3 py-2.5 text-[11px] leading-4"
              style={{
                borderColor: "var(--app-line)",
                backgroundColor: "var(--app-panel-soft)",
                color: "var(--app-muted)",
              }}
            >
              <Info size={13} className="mt-0.5 shrink-0" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
              <span>
                The model proposes the structure, but the server checks every decision and
                action quote against your notes. An owner or deadline that does not appear
                in the notes is removed before you see it.
              </span>
            </div>
          </Card>
        </form>

        <div className="xl:col-span-7">
          {loading ? (
            <Card className="p-5" aria-live="polite">
              <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--app-muted)" }}>
                <span className="app-spinner" aria-hidden="true" />
                Reading the notes…
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="app-skeleton h-4 w-2/5" />
                <div className="app-skeleton h-3 w-full" />
                <div className="app-skeleton h-3 w-10/12" />
              </div>
              <div className="mt-5 space-y-2.5">
                <div className="app-skeleton h-3 w-1/2" />
                <div className="app-skeleton h-3 w-5/6" />
                <div className="app-skeleton h-3 w-3/4" />
              </div>
            </Card>
          ) : record ? (
            <Card className="overflow-hidden">
              <div className="border-b px-4 py-3.5 sm:px-5" style={{ borderColor: "var(--app-line)" }}>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-heading text-[20px] leading-snug">{form.title}</h2>
                  {approved ? (
                    <Badge tone="forest">Approved</Badge>
                  ) : edited ? (
                    <Badge tone="gold">Edited — review</Badge>
                  ) : (
                    <Badge tone="gold">Draft</Badge>
                  )}
                  {saved ? <Badge tone="neutral">Saved to account</Badge> : null}                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} aria-hidden="true" />
                    {displayDate(form.date)}
                  </span>
                  <span>{projectName}</span>
                  <span>{form.source}</span>
                </div>

                <AiContextNote context={context} />

                {!editing ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" variant="secondary" onClick={startEditing}>
                      <Pencil size={13} aria-hidden="true" />
                      Edit record
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (approved) {
                          setApproved(false);
                          setSaved(false);
                        }
                        void runExtract(form);
                      }}
                    >
                      <RefreshCw size={13} aria-hidden="true" />
                      Regenerate
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={approved ? "gold" : "secondary"}
                      onClick={() => {
                        setApproved(true);
                        toast("Record approved. Save it to keep this version.", "success");
                      }}
                      disabled={approved || !canApprove}
                      title={
                        !canApprove
                          ? "Review and acknowledge the flagged items before approving."
                          : undefined
                      }
                    >
                      <ShieldCheck size={13} aria-hidden="true" />
                      {approved ? "Approved" : "Approve record"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={saved ? "gold" : "primary"}
                      onClick={() => void saveRecord()}
                      disabled={!approved || saved}
                      title={!approved ? "Approve the record before saving." : undefined}
                    >
                      <Save size={13} aria-hidden="true" />
                      {saved ? "Saved" : "Save"}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={exportRecord}
                      disabled={!approved}
                      title={!approved ? "Approve the record before exporting." : undefined}
                    >
                      <Download size={13} aria-hidden="true" />
                      Export
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={rejectDraft}
                      title="Discard this draft and keep the source notes."
                    >
                      <Trash2 size={13} aria-hidden="true" />
                      Reject draft
                    </Button>
                    {approved ? (
                      <CopyButton value={fullText} label="Copy" success="Approved record copied." />
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-3 text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                    Editing clears approval. Save the edits, then approve the record again.
                  </p>
                )}

                {!editing && !approved ? (
                  <p className="mt-2.5 rounded-md px-2.5 py-1.5 text-[11px]" style={{ backgroundColor: "var(--app-gold-soft)", color: "#6f5420" }}>
                    Approval is required before the record can be saved, copied, or exported.
                  </p>
                ) : null}
                {needsAcknowledgement && !editing && !approved ? (
                  <label
                    className="mt-2 flex cursor-pointer items-start gap-2.5 rounded-md border px-3 py-2.5 text-[11px] leading-5"
                    style={{
                      borderColor: "rgba(163, 90, 60, .45)",
                      backgroundColor: "var(--app-terracotta-soft)",
                      color: "#7a3a2a",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={flagsAcknowledged}
                      onChange={(event) => setFlagsAcknowledged(event.target.checked)}
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[color:var(--app-forest)]"
                    />
                    <span>
                      I reviewed the flagged items ({flaggedSummary}). I take responsibility
                      for keeping or removing them before saving.
                    </span>
                  </label>
                ) : null}
                {stale && !editing ? (
                  <p
                    className="mt-2 rounded-md border-l-2 px-2.5 py-1.5 text-[11px]"
                    style={{
                      borderColor: "var(--app-terracotta)",
                      backgroundColor: "var(--app-terracotta-soft)",
                      color: "#7a3a2a",
                    }}
                  >
                    The source material changed after this record was created. Regenerate so the
                    record matches the current notes.
                  </p>
                ) : null}
                {saved ? (
                  <p className="mt-2 text-[11px]" style={{ color: "var(--app-forest)" }}>
                    Saved to your account&apos;s knowledge repository. Other users cannot
                    access it.
                  </p>
                ) : null}
              </div>

              {editing ? (
                <div className="p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="app-label" style={{ marginBottom: 0 }}>
                      Editing record
                    </p>
                    <Badge tone="gold">Approval required after edits</Badge>
                  </div>

                  <div className="mt-3 space-y-3.5">
                    <Field
                      label="Executive summary"
                      htmlFor="edit-summary"
                      hint="Describe only what the notes support."
                    >
                      <Textarea
                        id="edit-summary"
                        rows={4}
                        value={editSummary}
                        onChange={(event) => setEditSummary(event.target.value)}
                      />
                    </Field>

                    <div className="grid gap-3.5 sm:grid-cols-2">
                      <Field label="Discussion points" htmlFor="edit-discussion" hint="One per line.">
                        <Textarea
                          id="edit-discussion"
                          rows={4}
                          value={editDiscussion}
                          onChange={(event) => setEditDiscussion(event.target.value)}
                        />
                      </Field>
                      <Field label="Decisions" htmlFor="edit-decisions" hint="One per line. Only confirmed decisions.">
                        <Textarea
                          id="edit-decisions"
                          rows={4}
                          value={editDecisions}
                          onChange={(event) => setEditDecisions(event.target.value)}
                        />
                      </Field>
                    </div>

                    <Field label="Unresolved questions" htmlFor="edit-questions" hint="One per line. Leave blank if none were raised.">
                      <Textarea
                        id="edit-questions"
                        rows={3}
                        value={editQuestions}
                        onChange={(event) => setEditQuestions(event.target.value)}
                      />
                    </Field>

                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="app-label" style={{ marginBottom: 0 }}>
                          Action items
                        </span>
                        <Badge tone="neutral">Owners and deadlines only if stated</Badge>
                      </div>
                      <div className="mt-2 space-y-2">
                        {editActions.map((action, index) => (
                          <div
                            key={index}
                            className="rounded-md border p-3"
                            style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10.5px] font-semibold tracking-[0.1em] uppercase" style={{ color: "var(--app-muted)" }}>
                                Action {index + 1}
                              </span>
                              <button
                                type="button"
                                className="app-icon-btn h-7 w-7"
                                aria-label={`Remove action ${index + 1}`}
                                onClick={() =>
                                  setEditActions((items) =>
                                    items.filter((_, itemIndex) => itemIndex !== index)
                                  )
                                }
                              >
                                <Trash2 size={13} aria-hidden="true" />
                              </button>
                            </div>
                            <div className="mt-2">
                              <Field label="Task" htmlFor={`edit-task-${index}`}>
                                <Input
                                  id={`edit-task-${index}`}
                                  value={action.task}
                                  onChange={(event) =>
                                    setEditActions((items) =>
                                      items.map((entry, itemIndex) =>
                                        itemIndex === index
                                          ? { ...entry, task: event.target.value }
                                          : entry
                                      )
                                    )
                                  }
                                />
                              </Field>
                            </div>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2">
                              <Field label="Owner" htmlFor={`edit-owner-${index}`}>
                                <Input
                                  id={`edit-owner-${index}`}
                                  value={action.owner ?? ""}
                                  placeholder="Not specified"
                                  onChange={(event) =>
                                    setEditActions((items) =>
                                      items.map((entry, itemIndex) =>
                                        itemIndex === index
                                          ? { ...entry, owner: event.target.value || null }
                                          : entry
                                      )
                                    )
                                  }
                                />
                              </Field>
                              <Field label="Deadline" htmlFor={`edit-due-${index}`}>
                                <Input
                                  id={`edit-due-${index}`}
                                  value={action.due ?? ""}
                                  placeholder="Not specified"
                                  onChange={(event) =>
                                    setEditActions((items) =>
                                      items.map((entry, itemIndex) =>
                                        itemIndex === index
                                          ? { ...entry, due: event.target.value || null }
                                          : entry
                                      )
                                    )
                                  }
                                />
                              </Field>
                            </div>
                          </div>
                        ))}
                        {editActions.length === 0 ? (
                          <p className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                            No action items. Add one only if the notes state it.
                          </p>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setEditActions((items) => [...items, { task: "", owner: null, due: null }])
                          }
                        >
                          <Plus size={13} aria-hidden="true" />
                          Add action
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Button type="button" onClick={saveEdits}>
                      <Save size={14} aria-hidden="true" />
                      Save changes
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="px-4 sm:px-5">
                    <Tabs items={tabs} value={tab} onChange={setTab} className="mt-1" />
                  </div>

                  <div className="p-4 sm:p-5">
                    {tab === "summary" ? (
                      <div>
                        <p className="app-label">Executive summary</p>
                        <p className="app-prose mt-1.5">{record.summary}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[
                            { label: "Discussion", value: record.discussion.length },
                            { label: "Decisions", value: record.decisions.length },
                            { label: "Open questions", value: record.questions.length },
                            { label: "Actions", value: record.actions.length },
                          ].map((stat) => (
                            <div
                              key={stat.label}
                              className="rounded-md border px-3 py-2.5"
                              style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
                            >
                              <p className="font-heading text-[20px] leading-none">{stat.value}</p>
                              <p className="mt-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                                {stat.label}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div
                          className="mt-4 rounded-md border-l-2 px-3 py-2.5 text-[11.5px] leading-5"
                          style={{
                            borderColor: "var(--app-gold)",
                            backgroundColor: "var(--app-gold-soft)",
                            color: "#6f5420",
                          }}
                        >
                          {approved
                            ? "This record is approved. Saving, copying, and export are enabled. A saved record is stored in your account only."
                            : "The record is a draft until you approve it. Approval enables saving, copying, and export. Nothing is shared with other users."}
                        </div>
                      </div>
                    ) : null}

                    {tab === "discussion" ? (
                      <div>
                        <p className="app-label">Key discussion points</p>
                        {record.discussion.length === 0 ? (
                          <EmptyState
                            icon={<FileText size={18} />}
                            title="No discussion points identified"
                            description="The supplied text did not contain statements the rules recognise as discussion. You can add them while editing."
                          />
                        ) : (
                          <ol className="mt-2 space-y-2">
                            {record.discussion.map((item, index) => {
                              const flag = validation?.discussion[index];
                              return (
                                <li
                                  key={`${item}-${index}`}
                                  className="flex items-start gap-2.5 rounded-md border px-3 py-2.5"
                                  style={{ borderColor: "var(--app-line)" }}
                                >
                                  <span className="mt-0.5 w-4 shrink-0 text-[10.5px] font-semibold" style={{ color: "var(--app-gold)" }}>
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <div className="min-w-0">
                                    <span className="text-[12.5px] leading-5">{item}</span>
                                    {flag && !flag.verified ? (
                                      <span className="mt-1.5 block">
                                        <Badge tone="terracotta">No matching quote — check</Badge>
                                      </span>
                                    ) : null}
                                    {flag?.evidence && flag.verified ? (
                                      <p className="mt-1 text-[10.5px] leading-4" style={{ color: "var(--app-muted)" }}>
                                        Source: “{flag.evidence}”
                                      </p>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                        )}
                      </div>
                    ) : null}

                    {tab === "decisions" ? (
                      <div>
                        <p className="app-label">Decisions</p>
                        {record.decisions.length === 0 ? (
                          <EmptyState
                            icon={<CircleAlert size={18} />}
                            title="No confirmed decisions appear in the notes"
                            description="The record will not invent a decision. If a decision was made, add it through Edit record and state the basis in the notes."
                          />
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {record.decisions.map((item, index) => {
                              const flag = validation?.decisions[index];
                              const verified = flag?.verified ?? true;
                              return (
                                <li
                                  key={`${item}-${index}`}
                                  className="flex items-start gap-2.5 rounded-md px-3 py-2.5"
                                  style={{
                                    backgroundColor: verified
                                      ? "var(--app-forest-soft)"
                                      : "var(--app-terracotta-soft)",
                                  }}
                                >
                                  {verified ? (
                                    <CheckCircle2
                                      size={14}
                                      className="mt-0.5 shrink-0"
                                      style={{ color: "var(--app-forest)" }}
                                      aria-hidden="true"
                                    />
                                  ) : (
                                    <CircleAlert
                                      size={14}
                                      className="mt-0.5 shrink-0"
                                      style={{ color: "var(--app-terracotta)" }}
                                      aria-hidden="true"
                                    />
                                  )}
                                  <div className="min-w-0">
                                    <span className="text-[12.5px] leading-5">{item}</span>
                                    {flag && !verified ? (
                                      <span className="mt-1.5 block">
                                        <Badge tone="terracotta">Unverified — no matching quote</Badge>
                                      </span>
                                    ) : null}
                                    {flag?.evidence && verified ? (
                                      <p className="mt-1 text-[10.5px] leading-4" style={{ color: "var(--app-muted)" }}>
                                        Source: “{flag.evidence}”
                                      </p>
                                    ) : null}
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>
                    ) : null}

                    {tab === "questions" ? (
                      <div>
                        <p className="app-label">Unresolved questions</p>
                        {record.questions.length === 0 ? (
                          <EmptyState
                            icon={<CheckCircle2 size={18} />}
                            title="No unresolved questions identified"
                            description="No open question or unconfirmed item was detected in the supplied notes."
                          />
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {record.questions.map((item, index) => (
                              <li
                                key={`${item}-${index}`}
                                className="flex items-start gap-2.5 rounded-md border px-3 py-2.5"
                                style={{ borderColor: "var(--app-line)" }}
                              >
                                <MessageCircleQuestion
                                  size={14}
                                  className="mt-0.5 shrink-0"
                                  style={{ color: "var(--app-terracotta)" }}
                                  aria-hidden="true"
                                />
                                <span className="text-[12.5px] leading-5">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}

                    {tab === "actions" ? (
                      <div>
                        <p className="app-label">Action items</p>
                        {record.actions.length === 0 ? (
                          <EmptyState
                            icon={<CircleAlert size={18} />}
                            title="No action items identified"
                            description="No explicit commitment was found in the notes. Add actions only when the source supports them."
                          />
                        ) : (
                          <ul className="mt-2 space-y-2">
                            {record.actions.map((action, index) => {
                              const flag = validation?.actions[index];
                              const evidenceMissing = flag ? !flag.evidenceVerified : false;
                              const ownerBlanked = Boolean(flag?.ownerSpecified && !flag.ownerVerified);
                              const dueBlanked = Boolean(flag?.dueSpecified && !flag.dueVerified);
                              return (
                                <li
                                  key={`${action.task}-${index}`}
                                  className="rounded-md border px-3.5 py-3"
                                  style={{ borderColor: "var(--app-line)" }}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-2">
                                    <p className="text-[12.5px] leading-5 font-medium">
                                      {action.task}
                                    </p>
                                    {evidenceMissing ? (
                                      <Badge tone="terracotta">Unverified — no matching quote</Badge>
                                    ) : null}
                                  </div>
                                  <div className="mt-2 flex flex-wrap gap-1.5">
                                    <Badge tone={action.owner ? "forest" : "neutral"}>
                                      Owner: {action.owner ?? "Not specified"}
                                    </Badge>
                                    <Badge tone={action.due ? "forest" : "neutral"}>
                                      Deadline: {action.due ?? "Not specified"}
                                    </Badge>
                                    {ownerBlanked ? (
                                      <Badge tone="terracotta">Owner removed — not in notes</Badge>
                                    ) : null}
                                    {dueBlanked ? (
                                      <Badge tone="terracotta">Deadline removed — not in notes</Badge>
                                    ) : null}
                                  </div>
                                  {flag?.evidence && flag.evidenceVerified ? (
                                    <p className="mt-2 text-[10.5px] leading-4" style={{ color: "var(--app-muted)" }}>
                                      Source: “{flag.evidence}”
                                    </p>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ul>
                        )}
                        <p className="mt-3 text-[11px]" style={{ color: "var(--app-muted)" }}>
                          “Not specified” means the supplied notes did not state it. Add a
                          name or date only if the record should show one.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </>
              )}

              <div
                className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-[10.5px] sm:px-5"
                style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={12} aria-hidden="true" />
                  AI-assisted · every decision and action checked against your notes
                </span>
                <span className="inline-flex items-center gap-2">
                  <AiMetaNote meta={meta} />
                  <span>{form.notes.trim().split(/\s+/).filter(Boolean).length} source words</span>
                </span>
              </div>
            </Card>
          ) : (
            <Card className="flex min-h-[420px] items-center justify-center">
              <EmptyState
                icon={<NotebookPen size={20} />}
                title="The draft record will appear here"
                description="Paste notes or a consented transcript, then generate. Confirmed decisions, open questions, and actions are separated. Owners and deadlines are left blank when the notes do not state them."
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
