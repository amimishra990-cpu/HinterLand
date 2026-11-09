"use client";

import { useMemo, useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  Eraser,
  FileText,
  Info,
  PenLine,
  Pencil,
  Save,
  Sparkles,
} from "lucide-react";

import { useToast } from "@/components/app/toast";
import { AiContextNote, AiMetaNote } from "@/components/app/ai-notice";
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
import type { RefinementResult } from "@/lib/ai/result-types";
import {
  AiRequestError,
  postAi,
  type AiContextSummary,
  type AiMeta,
} from "@/lib/ai-client";
import { useWorkspace } from "@/components/app/workspace-provider";

const TYPES = [
  "Email",
  "Professional message",
  "Proposal",
  "Discussion point",
  "General communication",
];

const TONES = ["Formal", "Professional", "Diplomatic", "Persuasive", "Concise", "Friendly"];

type FormState = {
  message: string;
  intention: string;
  communicationType: string;
  audience: string;
  tone: string;
  project: string;
};

const EMPTY_FORM: FormState = {
  message: "",
  intention: "",
  communicationType: "Email",
  audience: "",
  tone: "Professional",
  project: "",
};

type RefinementResponse = {
  result: RefinementResult & { unsupportedClaims?: string[] };
  meta: AiMeta;
  context: AiContextSummary;
};

function wordCount(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

export function CommunicationWorkspace() {
  const toast = useToast();
  const { data, createKnowledge } = useWorkspace();
  const projects = data.projects;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [result, setResult] = useState<RefinementResponse["result"] | null>(null);
  const [meta, setMeta] = useState<AiMeta | null>(null);
  const [context, setContext] = useState<AiContextSummary | null>(null);
  const [documentIds, setDocumentIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("refined");
  const [editing, setEditing] = useState(false);
  const [edited, setEdited] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const projectDocuments = useMemo(
    () => data.documents.filter((document) => document.projectId === form.project),
    [data.documents, form.project]
  );

  const runRefine = async (value: FormState) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setMeta(null);
    setContext(null);
    setEditing(false);
    setSaved(false);

    try {
      const payload = await postAi<RefinementResponse>("/api/ai/communication", {
        draft: value.message,
        intention: value.intention,
        audience: value.audience,
        channel: value.communicationType,
        tone: value.tone,
        projectId: value.project || null,
        documentIds,
      });
      setResult(payload.result);
      setMeta(payload.meta);
      setContext(payload.context);
      setEdited(payload.result.refined);
      setTab("refined");
      toast("Draft refined by the configured AI provider. Review it before you use it.", "success");
    } catch (requestError) {
      const message =
        requestError instanceof AiRequestError
          ? requestError.message
          : "The refinement could not be completed. Nothing was saved.";
      setError(message);
      toast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.message.trim()) {
      setError("Add the original message before refining.");
      toast("Add the original message before refining.", "error");
      return;
    }
    void runRefine(form);
  };

  const clearAll = () => {
    setForm(EMPTY_FORM);
    setResult(null);
    setMeta(null);
    setContext(null);
    setDocumentIds([]);
    setEdited("");
    setEditing(false);
    setSaved(false);
    setError(null);
    toast("Editor cleared.", "info");
  };

  const currentText = result ? edited || result.refined : "";
  const unsupportedClaims = result?.unsupportedClaims ?? [];

  const saveDraft = async () => {
    if (!result) return;
    const savedResult = await createKnowledge({
      title: `${form.communicationType} refinement`,
      type: "Refinement",
      projectId: form.project || null,
      topic: "Communication",
      description: result.intention || "Refined communication draft.",
      content: [
        `Original message: ${form.message}`,
        `Refined message: ${currentText}`,
      ],
      related: result.warnings.map((warning) => warning.phrase),
      approved: true,
    });
    if (!savedResult.ok) {
      toast(savedResult.error ?? "The draft could not be saved.", "error");
      return;
    }
    setSaved(true);
    toast("Draft saved to your knowledge repository.", "success");
  };

  const tabs = useMemo(
    () => [
      { value: "refined", label: "Refined version" },
      { value: "alternative", label: "Alternative" },
      ...(result
        ? [
            {
              value: "improvements",
              label: "Clarity",
              count: result.improvements.length,
            },
              { value: "warnings", label: "Warnings", count: result.warnings.length + (result.unsupportedClaims?.length ?? 0) },
            { value: "changes", label: "Changes", count: result.changes.length },
          ]
        : []),
    ],
    [result]
  );

  return (
    <>
      <PageHeader
        eyebrow="Communication"
        title="Refine a message"
        description="Keep the meaning, improve the delivery. Only the text and project sources you select are sent to the configured AI provider. It flags ambiguity and unsupported claims, shows every change, and saves nothing until you approve a draft."
        actions={
          <>
            <Button type="button" variant="ghost" onClick={clearAll}>
              <Eraser size={14} aria-hidden="true" />
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
                <h2 className="font-heading text-[18px]">Original message</h2>
                <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                  Supply the text and the reader it is for.
                </p>
              </div>
              <Badge tone="forest">Private to you</Badge>
            </div>

            <div className="mt-4 grid gap-3.5 sm:grid-cols-2">
              <Field label="Communication type" htmlFor="comm-type">
                <Select
                  id="comm-type"
                  value={form.communicationType}
                  onChange={(event) => update("communicationType", event.target.value)}
                >
                  {TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Desired tone" htmlFor="comm-tone">
                <Select
                  id="comm-tone"
                  value={form.tone}
                  onChange={(event) => update("tone", event.target.value)}
                >
                  {TONES.map((tone) => (
                    <option key={tone} value={tone}>
                      {tone}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label="Intended audience" htmlFor="comm-audience">
                <Input
                  id="comm-audience"
                  value={form.audience}
                  onChange={(event) => update("audience", event.target.value)}
                  placeholder="e.g. Client lead update"
                />
              </Field>

              <Field label="Project context" htmlFor="comm-project" hint="Optional">
                <Select
                  id="comm-project"
                  value={form.project}
                  onChange={(event) => {
                    update("project", event.target.value);
                    setDocumentIds([]);
                  }}
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

            {form.project && projectDocuments.length > 0 ? (
              <div className="mt-3.5">
                <p className="app-label" style={{ marginBottom: 6 }}>
                  Supporting documents · optional
                </p>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {projectDocuments.slice(0, 8).map((document) => {
                    const checked = documentIds.includes(document.id);
                    return (
                      <label
                        key={document.id}
                        className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-[11.5px]"
                        style={{
                          borderColor: checked ? "var(--app-forest)" : "var(--app-line)",
                          backgroundColor: checked ? "var(--app-forest-soft)" : "transparent",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) =>
                            setDocumentIds((current) =>
                              event.target.checked
                                ? [...current, document.id].slice(0, 5)
                                : current.filter((id) => id !== document.id)
                            )
                          }
                        />
                        <span className="min-w-0 flex-1 truncate">{document.name}</span>
                        <span style={{ color: "var(--app-muted)" }}>{document.type}</span>
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                  Only checked documents are sent as context.
                </p>
              </div>
            ) : null}

            <div className="mt-3.5">
              <Field
                label="Message"
                htmlFor="comm-message"
                required
                hint={`${wordCount(form.message)} words · ${form.message.length} characters`}
              >
                <Textarea
                  id="comm-message"
                  rows={9}
                  value={form.message}
                  onChange={(event) => {
                    update("message", event.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Paste the message you intend to send…"
                  aria-invalid={Boolean(error)}
                />
              </Field>
              {error ? (
                <p className="mt-1.5 flex items-center gap-1.5 text-[11.5px]" style={{ color: "var(--app-terracotta)" }}>
                  <CircleAlert size={12} aria-hidden="true" />
                  {error}
                </p>
              ) : null}
            </div>

            <div className="mt-3.5">
              <Field
                label="What must stay true"
                htmlFor="comm-intention"
                hint="The point the reader must still understand after rewriting."
              >
                <Textarea
                  id="comm-intention"
                  rows={2}
                  value={form.intention}
                  onChange={(event) => update("intention", event.target.value)}
                  placeholder="State the intended meaning in one line…"
                  style={{ minHeight: 72 }}
                />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="app-spinner" aria-hidden="true" />
                    Refining…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} aria-hidden="true" />
                    Refine message
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
                The configured AI provider receives this draft, your stated intention, and only
                the project sources you selected. It cannot add facts, owners, or deadlines, and
                nothing is saved or sent until you review the result.
              </span>
            </div>
          </Card>
        </form>

        <div className="xl:col-span-7">
          {loading ? (
            <Card className="p-5" aria-live="polite">
              <div className="flex items-center gap-2 text-[12.5px]" style={{ color: "var(--app-muted)" }}>
                <span className="app-spinner" aria-hidden="true" />
                Working through the message…
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="app-skeleton h-4 w-1/3" />
                <div className="app-skeleton h-3 w-full" />
                <div className="app-skeleton h-3 w-11/12" />
                <div className="app-skeleton h-3 w-4/5" />
                <div className="app-skeleton h-3 w-2/3" />
              </div>
              <div className="mt-5 space-y-2.5">
                <div className="app-skeleton h-3 w-1/2" />
                <div className="app-skeleton h-3 w-5/6" />
              </div>
            </Card>
          ) : result ? (
            <Card className="overflow-hidden">
              <div
                className="flex flex-col gap-3 border-b px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                style={{ borderColor: "var(--app-line)" }}
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-heading text-[18px]">Refinement result</h2>
                    <Badge tone="navy">Generated · review required</Badge>
                    {saved ? <Badge tone="gold">Approved & saved</Badge> : null}
                  </div>
                  <p className="mt-1 text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                    {form.communicationType} · {form.tone} tone
                    {form.audience ? ` · for ${form.audience}` : ""}
                  </p>
                  <p className="mt-1 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                    <AiMetaNote meta={meta} />
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <CopyButton value={currentText} label="Copy refined" success="Refined version copied." />
                </div>
              </div>

              <div className="px-4 sm:px-5">
                <Tabs items={tabs} value={tab} onChange={setTab} className="mt-1" />
              </div>

              <div className="p-4 sm:p-5">
                {tab === "refined" ? (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="app-label" style={{ marginBottom: 0 }}>
                        Refined version
                      </p>
                      <span className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                        {wordCount(currentText)} words
                      </span>
                    </div>

                    {editing ? (
                      <div className="mt-2">
                        <Textarea
                          value={edited}
                          onChange={(event) => {
                            setEdited(event.target.value);
                            setSaved(false);
                          }}
                          rows={12}
                          aria-label="Edit refined version"
                        />
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              setResult((current) =>
                                current ? { ...current, refined: edited } : current
                              );
                              setEditing(false);
                              setSaved(false);
                              toast("Refined version updated.", "success");
                            }}
                          >
                            <Save size={13} aria-hidden="true" />
                            Apply edit
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEdited(result.refined);
                              setEditing(false);
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className="app-prose mt-2 rounded-md border px-4 py-3.5 whitespace-pre-wrap"
                        style={{
                          borderColor: "var(--app-line)",
                          backgroundColor: "var(--app-panel-soft)",
                        }}
                      >
                        {result.subject ? (
                          <p className="mb-3 border-b pb-2.5" style={{ borderColor: "var(--app-line)" }}>
                            <span className="app-label" style={{ display: "inline", marginRight: 8 }}>
                              Subject
                            </span>
                            {result.subject}
                          </p>
                        ) : null}
                        {edited || result.refined}
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <CopyButton value={currentText} label="Copy" />
                      {!editing ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditing(true);
                            toast("Editing the refined version before saving.", "info");
                          }}
                        >
                          <Pencil size={13} aria-hidden="true" />
                          Edit
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        variant={saved ? "gold" : "primary"}
                        onClick={() => void saveDraft()}
                        disabled={saved}
                      >
                        {saved ? (
                          <>
                            <CircleCheck size={13} aria-hidden="true" />
                            Approved & saved
                          </>
                        ) : (
                          <>
                            <Save size={13} aria-hidden="true" />
                            Approve & save
                          </>
                        )}
                      </Button>
                      <span className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                        Saving stores the approved draft in your knowledge repository.
                      </span>
                    </div>

                    <div
                      className="mt-4 rounded-md border-l-2 px-3 py-2.5 text-[11.5px] leading-5"
                      style={{
                        borderColor: "var(--app-gold)",
                        backgroundColor: "var(--app-gold-soft)",
                        color: "#6f5420",
                      }}
                    >
                      <span className="font-semibold">Intended meaning: </span>
                      {result.intention}
                    </div>

                    <AiContextNote context={context} />
                  </div>
                ) : null}

                {tab === "alternative" ? (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="app-label" style={{ marginBottom: 0 }}>
                        Alternative wording
                      </p>
                      <CopyButton
                        value={result.alternative}
                        label="Copy alternative"
                        success="Alternative wording copied."
                      />
                    </div>
                    <div
                      className="app-prose mt-2 rounded-md border px-4 py-3.5 whitespace-pre-wrap"
                      style={{
                        borderColor: "var(--app-line)",
                        backgroundColor: "var(--app-panel-soft)",
                      }}
                    >
                      {result.alternative}
                    </div>
                    <p className="mt-2 text-[11px]" style={{ color: "var(--app-muted)" }}>
                      A second construction of the same request. Use whichever reads closer
                      to your own voice.
                    </p>
                  </div>
                ) : null}

                {tab === "improvements" ? (
                  <div>
                    <p className="app-label">Clarity improvements</p>
                    <ul className="mt-2 space-y-2.5">
                      {result.improvements.map((item) => (
                        <li key={item} className="flex items-start gap-2.5">
                          <CircleCheck
                            size={15}
                            className="mt-0.5 shrink-0"
                            style={{ color: "var(--app-forest)" }}
                            aria-hidden="true"
                          />
                          <span className="text-[12.5px] leading-5">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {tab === "warnings" ? (
                  <div>
                    <p className="app-label">Ambiguity warnings</p>
                    {result.warnings.length === 0 && unsupportedClaims.length === 0 ? (
                      <EmptyState
                        icon={<CircleCheck size={18} />}
                        title="No ambiguity warnings found"
                        description="The supplied message names its timing and quantity, or makes no claim that needs either."
                      />
                    ) : null}
                    {result.warnings.length > 0 ? (
                      <ul className="mt-2 space-y-2.5">
                        {result.warnings.map((warning) => (
                          <li
                            key={`${warning.phrase}-${warning.issue}`}
                            className="rounded-md border px-3.5 py-3"
                            style={{
                              borderColor: "var(--app-line)",
                              backgroundColor: "var(--app-terracotta-soft)",
                            }}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <CircleAlert size={14} style={{ color: "var(--app-terracotta)" }} aria-hidden="true" />
                              <span className="text-[12.5px] font-semibold">“{warning.phrase}”</span>
                              <Badge tone="terracotta">Check</Badge>
                            </div>
                            <p className="mt-1.5 text-[12px] leading-5">{warning.issue}</p>
                            <p className="mt-1 text-[11.5px] leading-5" style={{ color: "var(--app-ink-soft)" }}>
                              <span className="font-semibold">Suggested fix: </span>
                              {warning.suggestion}
                            </p>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {unsupportedClaims.length > 0 ? (
                      <div className="mt-4">
                        <p className="app-label">Claims without support in the selected context</p>
                        <ul className="mt-2 space-y-2">
                          {unsupportedClaims.map((claim) => (
                            <li
                              key={claim}
                              className="rounded-md border px-3.5 py-2.5 text-[12px] leading-5"
                              style={{
                                borderColor: "var(--app-line)",
                                backgroundColor: "var(--app-terracotta-soft)",
                              }}
                            >
                              {claim}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-1.5 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                          These are not confirmed facts. Remove them or add the supporting source
                          before sending.
                        </p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {tab === "changes" ? (
                  <div>
                    <p className="app-label">Explanation of changes</p>
                    <ul className="mt-2 space-y-2">
                      {result.changes.map((change) => (
                        <li
                          key={`${change.before}-${change.after}`}
                          className="rounded-md border px-3.5 py-3"
                          style={{ borderColor: "var(--app-line)" }}
                        >
                          <div className="flex flex-wrap items-center gap-2 text-[12px]">
                            <span
                              className="rounded px-1.5 py-0.5"
                              style={{ backgroundColor: "var(--app-terracotta-soft)", color: "#8c4a2f" }}
                            >
                              {change.before}
                            </span>
                            <span aria-hidden="true" style={{ color: "var(--app-muted)" }}>
                              →
                            </span>
                            <span
                              className="rounded px-1.5 py-0.5"
                              style={{ backgroundColor: "var(--app-forest-soft)", color: "#2c4a39" }}
                            >
                              {change.after}
                            </span>
                          </div>
                          <p className="mt-1.5 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
                            {change.reason}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              <div
                className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-2.5 text-[10.5px] sm:px-5"
                style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <FileText size={12} aria-hidden="true" />
                  <AiMetaNote meta={meta} />
                  <span>· reviewed by you before saving</span>
                </span>
                <span>
                  {meta
                    ? `${meta.usage.inputTokens + meta.usage.outputTokens} tokens · ${meta.latencyMs} ms · nothing is sent`
                    : "Nothing is sent from this workspace."}
                </span>
              </div>
            </Card>
          ) : (
            <Card className="flex min-h-[420px] items-center justify-center">
              <EmptyState
                icon={<PenLine size={20} />}
                title="The refined draft will appear here"
                description="Add a message and choose the tone, audience, and communication type. Then refine to see the revised version, an alternative, the clarity improvements, and any ambiguity warnings."
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
