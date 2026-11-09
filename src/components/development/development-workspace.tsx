"use client";

import { useState } from "react";
import {
  CircleAlert,
  CircleCheck,
  History,
  Info,
  Plus,
  Quote,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Sprout,
  Trash2,
} from "lucide-react";

import { useToast } from "@/components/app/toast";
import {
  Badge,
  Button,
  Card,
  CopyButton,
  Field,
  Input,
  PageHeader,
  SectionHeading,
  Select,
  Textarea,
} from "@/components/app/ui";
import { useWorkspace } from "@/components/app/workspace-provider";
import { AiMetaNote } from "@/components/app/ai-notice";
import {
  AiRequestError,
  postAi,
  type AiMeta,
} from "@/lib/ai-client";

const TONES = ["Formal", "Professional", "Diplomatic", "Persuasive", "Concise", "Friendly"];
const STRUCTURES = [
  "Short, direct sentences",
  "One idea per paragraph",
  "Keep my original sentence rhythm",
  "Active voice first",
];
const GREETINGS = ["Warm and brief", "Formal greeting", "No greeting"];

type Preferences = {
  tone: string;
  structure: string;
  greeting: string;
  signOff: string;
  preserve: string;
  useExamples: boolean;
};

const DEFAULT_PREFERENCES: Preferences = {
  tone: "Professional",
  structure: "Short, direct sentences",
  greeting: "Warm and brief",
  signOff: "Best,",
  preserve:
    "Keep the original reason and the direct request. Do not add deadlines, owners, or context that I have not stated.",
  useExamples: true,
};

type DevelopmentResult = {
  consistency: { aspect: string; status: "aligned" | "drift" | "unclear"; detail: string }[];
  suggestions: { title: string; detail: string }[];
  revisedDraft: string | null;
  usesApprovedExamples: boolean;
};

type DevelopmentResponse = {
  result: DevelopmentResult;
  meta: AiMeta;
  context: {
    preferences: {
      tone: string;
      structure: string;
      greeting: string;
      signOff: string;
      preserve: string;
    };
    examplesSupplied: { id: string; title: string }[];
    examplesEnabled: boolean;
  };
};

export function DevelopmentWorkspace() {
  const toast = useToast();
  const { data, saveWritingPreferences, addWritingExample, removeWritingExample } =
    useWorkspace();
  const examples = data.writingExamples;
  const activity = data.knowledge.slice(0, 4);
  const [prefs, setPrefs] = useState<Preferences>(data.writingPreferences);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [draft, setDraft] = useState("");
  const [projectId, setProjectId] = useState("");
  const [devBusy, setDevBusy] = useState(false);
  const [devError, setDevError] = useState<string | null>(null);
  const [devResult, setDevResult] = useState<DevelopmentResponse | null>(null);
  const [exampleDraft, setExampleDraft] = useState({
    title: "",
    context: "",
    excerpt: "",
  });
  const [exampleError, setExampleError] = useState<string | null>(null);
  const [addingExample, setAddingExample] = useState(false);

  const addExample = async () => {
    if (!exampleDraft.excerpt.trim()) {
      setExampleError("Add the writing sample you want Hinterland to follow.");
      return;
    }
    setAddingExample(true);
    const result = await addWritingExample({
      title: exampleDraft.title.trim(),
      context: exampleDraft.context.trim(),
      excerpt: exampleDraft.excerpt.trim(),
    });
    setAddingExample(false);
    if (!result.ok) {
      const message = result.error ?? "The writing example could not be saved.";
      setExampleError(message);
      toast(message, "error");
      return;
    }
    setExampleDraft({ title: "", context: "", excerpt: "" });
    setExampleError(null);
    toast("Writing example approved and saved to your account.", "success");
  };

  const removeExample = async (id: string) => {
    const result = await removeWritingExample(id);
    if (!result.ok) {
      toast(result.error ?? "The writing example could not be removed.", "error");
      return;
    }
    toast("Writing example removed. It is no longer available as guidance.", "info");
  };

  const update = <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
    setPrefs((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const savePreferences = async () => {
    setSaving(true);
    const result = await saveWritingPreferences(prefs);
    setSaving(false);
    if (!result.ok) {
      toast(result.error ?? "Preferences could not be saved.", "error");
      return;
    }
    setSaved(true);
    toast("Preferences saved to your account.", "success");
  };

  const runConsistency = async () => {
    if (!draft.trim()) {
      setDevError("Paste a draft so it can be reviewed against your preferences.");
      return;
    }
    if (!saved) {
      const stored = await saveWritingPreferences(prefs);
      if (!stored.ok) {
        const message = stored.error ?? "Preferences could not be saved before the review.";
        setDevError(message);
        toast(message, "error");
        return;
      }
      setSaved(true);
    }
    setDevBusy(true);
    setDevError(null);
    try {
      const response = await postAi<DevelopmentResponse>("/api/ai/development", {
        draft: draft.trim(),
        projectId: projectId || null,
      });
      setDevResult(response);
      toast("Consistency review complete. Suggestions still need your judgement.", "success");
    } catch (failure) {
      const message =
        failure instanceof AiRequestError
          ? failure.message
          : "The consistency review could not be completed.";
      setDevError(message);
      toast(message, "error");
    } finally {
      setDevBusy(false);
    }
  };

  const resetPreferences = () => {
    setPrefs(DEFAULT_PREFERENCES);
    setSaved(false);
    toast("Preferences reset. Save to keep the defaults.", "info");
  };

  return (
    <>
      <PageHeader
        eyebrow="My Development"
        title="Your working preferences"
        description="Hinterland follows the tone, structure, and examples you approve. This page shows exactly what it is allowed to use, why a suggestion appeared, and where it came from."
        actions={
          <>
            <Badge tone="forest">Preferred tone: {prefs.tone}</Badge>
            <a href="#how-it-works" className="app-btn app-btn-secondary app-btn-sm">
              How this works
            </a>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void savePreferences();
            }}
          >
            <Card className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-heading text-[18px]">Communication preferences</h2>
                  <p className="mt-0.5 text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                    Stored in your account and applied to refinements.
                  </p>
                </div>
                <Badge tone="forest">Private to you</Badge>
              </div>

              <div className="mt-4 space-y-3.5">
                <Field label="Preferred tone" htmlFor="dev-tone">
                  <Select
                    id="dev-tone"
                    value={prefs.tone}
                    onChange={(event) => update("tone", event.target.value)}
                  >
                    {TONES.map((tone) => (
                      <option key={tone} value={tone}>
                        {tone}
                      </option>
                    ))}
                  </Select>
                </Field>

                <Field label="Preferred sentence structure" htmlFor="dev-structure">
                  <Select
                    id="dev-structure"
                    value={prefs.structure}
                    onChange={(event) => update("structure", event.target.value)}
                  >
                    {STRUCTURES.map((structure) => (
                      <option key={structure} value={structure}>
                        {structure}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="grid gap-3.5 sm:grid-cols-2">
                  <Field label="Greeting style" htmlFor="dev-greeting">
                    <Select
                      id="dev-greeting"
                      value={prefs.greeting}
                      onChange={(event) => update("greeting", event.target.value)}
                    >
                      {GREETINGS.map((greeting) => (
                        <option key={greeting} value={greeting}>
                          {greeting}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Sign-off" htmlFor="dev-signoff">
                    <Input
                      id="dev-signoff"
                      value={prefs.signOff}
                      onChange={(event) => update("signOff", event.target.value)}
                      placeholder="e.g. Best,"
                    />
                  </Field>
                </div>

                <Field
                  label="What should always be preserved"
                  htmlFor="dev-preserve"
                  hint="Refinement treats this as a hard boundary."
                >
                  <Textarea
                    id="dev-preserve"
                    rows={4}
                    value={prefs.preserve}
                    onChange={(event) => update("preserve", event.target.value)}
                  />
                </Field>

                <div
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2.5"
                  style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
                >
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold">Use approved examples as guidance</p>
                    <p className="mt-0.5 text-[11px] leading-4" style={{ color: "var(--app-muted)" }}>
                      Only the examples on this page. Nothing else is read.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={prefs.useExamples}
                    aria-label="Use approved examples as guidance"
                    onClick={() => update("useExamples", !prefs.useExamples)}
                    className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors"
                    style={{
                      backgroundColor: prefs.useExamples
                        ? "var(--app-forest)"
                        : "var(--app-line-strong)",
                    }}
                  >
                    <span
                      className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
                      style={{
                        left: 2,
                        transform: prefs.useExamples ? "translateX(16px)" : "translateX(0)",
                      }}
                    />
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button type="submit" variant={saved ? "gold" : "primary"} disabled={saving}>
                  {saving ? (
                    <>
                      <span className="app-spinner" aria-hidden="true" />
                      Saving…
                    </>
                  ) : saved ? (
                    <>
                      <CircleCheck size={14} aria-hidden="true" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save size={14} aria-hidden="true" />
                      Save preferences
                    </>
                  )}
                </Button>
                <Button type="button" variant="secondary" onClick={resetPreferences}>
                  <RotateCcw size={14} aria-hidden="true" />
                  Reset to defaults
                </Button>
              </div>

              {saved ? (
                <p className="mt-2 text-[11px]" style={{ color: "var(--app-forest)" }}>
                  Saved to your account. No model was trained.
                </p>
              ) : (
                <p className="mt-2 text-[11px]" style={{ color: "var(--app-muted)" }}>
                  Use Save to store these preferences in your account.
                </p>
              )}
            </Card>
          </form>
        </div>

        <div className="space-y-4 xl:col-span-7">
          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Approved writing examples"
              description="Material you approved for guidance. Add a sample or remove one at any time; changes are saved to your account."
              action={<Badge tone="forest">{examples.length} approved</Badge>}
            />

            {!prefs.useExamples ? (
              <p
                className="mt-3 rounded-md px-3 py-2 text-[11.5px]"
                style={{ backgroundColor: "var(--app-gold-soft)", color: "#6f5420" }}
              >
                Example guidance is currently off. The examples remain stored, but
                refinements will not use them.
              </p>
            ) : null}

            <ul className="mt-3 space-y-2">
              {examples.map((example) => (
                <li
                  key={example.id}
                  className="rounded-md border px-3.5 py-3"
                  style={{ borderColor: "var(--app-line)" }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <Quote size={13} className="mt-0.5 shrink-0" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
                      <div>
                        <p className="text-[12.5px] font-semibold">{example.title}</p>
                        <p className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                          {example.context} · {example.approved}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <CopyButton
                        value={example.excerpt}
                        label="Copy"
                        success="Approved example copied."
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => void removeExample(example.id)}
                        aria-label={`Remove ${example.title}`}
                      >
                        <Trash2 size={13} aria-hidden="true" />
                        Remove
                      </Button>
                    </div>
                  </div>
                  <p className="mt-2 text-[12px] leading-5" style={{ color: "var(--app-ink-soft)" }}>
                    “{example.excerpt}”
                  </p>
                </li>
              ))}
              {examples.length === 0 ? (
                <li className="rounded-md border border-dashed px-3.5 py-4 text-[12px]" style={{ borderColor: "var(--app-line-strong)", color: "var(--app-muted)" }}>
                  No approved examples. Add one below, or leave example guidance off.
                </li>
              ) : null}
            </ul>

            <div
              className="mt-3 rounded-md border px-3.5 py-3"
              style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
            >
              <p className="app-label">Add an approved example</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <Field label="Title" htmlFor="example-title">
                  <Input
                    id="example-title"
                    value={exampleDraft.title}
                    onChange={(event) =>
                      setExampleDraft((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Client status update"
                  />
                </Field>
                <Field label="Context" htmlFor="example-context">
                  <Input
                    id="example-context"
                    value={exampleDraft.context}
                    onChange={(event) =>
                      setExampleDraft((current) => ({
                        ...current,
                        context: event.target.value,
                      }))
                    }
                    placeholder="e.g. Weekly written update"
                  />
                </Field>
              </div>
              <div className="mt-2">
                <Field
                  label="Writing sample"
                  htmlFor="example-excerpt"
                  hint="Paste only material you are comfortable using as guidance."
                >
                  <Textarea
                    id="example-excerpt"
                    rows={3}
                    value={exampleDraft.excerpt}
                    onChange={(event) => {
                      setExampleDraft((current) => ({
                        ...current,
                        excerpt: event.target.value,
                      }));
                      if (exampleError) setExampleError(null);
                    }}
                    placeholder="Paste a message or paragraph that sounds like you."
                  />
                </Field>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => void addExample()}
                  disabled={addingExample}
                >
                  <Plus size={13} aria-hidden="true" />
                  {addingExample ? "Saving…" : "Approve example"}
                </Button>
                <span className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                  Added examples count immediately when example guidance is on.
                </span>
              </div>
              {exampleError ? (
                <p className="mt-2 text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
                  {exampleError}
                </p>
              ) : null}
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Consistency review"
              description="Compares a draft against the preferences and approved examples on this page. It flags drift and suggests changes; it does not learn from the draft."
              action={<Badge tone="gold">On demand</Badge>}
            />

            <div className="mt-3 space-y-3">
              <Field
                label="Draft to review"
                htmlFor="dev-draft"
                hint={`${draft.trim().split(/\s+/).filter(Boolean).length} words · only this text is sent`}
              >
                <Textarea
                  id="dev-draft"
                  rows={8}
                  value={draft}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    if (devError) setDevError(null);
                  }}
                  placeholder="Paste a message you wrote so it can be compared with your stated preferences and approved examples…"
                />
              </Field>

              <Field label="Project context" htmlFor="dev-project" hint="Optional">
                <Select
                  id="dev-project"
                  value={projectId}
                  onChange={(event) => setProjectId(event.target.value)}
                >
                  <option value="">No project</option>
                  {data.projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </Select>
              </Field>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  onClick={() => void runConsistency()}
                  disabled={devBusy}
                >
                  {devBusy ? (
                    <>
                      <span className="app-spinner" aria-hidden="true" />
                      Reviewing…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} aria-hidden="true" />
                      Analyze consistency
                    </>
                  )}
                </Button>
                <span className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                  Unsaved preference changes are saved first so the review matches this page.
                </span>
              </div>

              {devError ? (
                <p className="flex items-start gap-1.5 text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
                  <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {devError}
                </p>
              ) : null}
            </div>

            {devResult ? (
              <div className="mt-4 space-y-4">
                <div>
                  <p className="app-label">Consistency with your preferences</p>
                  <ul className="mt-1.5 space-y-2">
                    {devResult.result.consistency.map((item) => (
                      <li
                        key={`${item.aspect}-${item.detail}`}
                        className="rounded-md border px-3 py-2.5"
                        style={{ borderColor: "var(--app-line)" }}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[12.5px] font-semibold">{item.aspect}</span>
                          <Badge
                            tone={
                              item.status === "aligned"
                                ? "forest"
                                : item.status === "drift"
                                  ? "terracotta"
                                  : "gold"
                            }
                          >
                            {item.status === "aligned"
                              ? "Aligned"
                              : item.status === "drift"
                                ? "Drift"
                                : "Unclear"}
                          </Badge>
                        </div>
                        <p className="mt-1 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
                          {item.detail}
                        </p>
                      </li>
                    ))}
                    {devResult.result.consistency.length === 0 ? (
                      <li className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                        No consistency findings were returned.
                      </li>
                    ) : null}
                  </ul>
                </div>

                <div>
                  <p className="app-label">Suggestions</p>
                  <ul className="mt-1.5 space-y-2">
                    {devResult.result.suggestions.map((suggestion) => (
                      <li key={suggestion.title} className="flex items-start gap-2">
                        <Sparkles
                          size={13}
                          className="mt-0.5 shrink-0"
                          style={{ color: "var(--app-gold)" }}
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-[12px] font-semibold">{suggestion.title}</p>
                          <p className="mt-0.5 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
                            {suggestion.detail}
                          </p>
                        </div>
                      </li>
                    ))}
                    {devResult.result.suggestions.length === 0 ? (
                      <li className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                        No suggestions were returned.
                      </li>
                    ) : null}
                  </ul>
                </div>

                {devResult.result.revisedDraft ? (
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="app-label" style={{ marginBottom: 0 }}>
                        Suggested revision
                      </p>
                      <CopyButton
                        value={devResult.result.revisedDraft}
                        label="Copy revision"
                        success="Suggested revision copied."
                      />
                    </div>
                    <p
                      className="app-prose mt-1.5 whitespace-pre-wrap rounded-md border px-3.5 py-3"
                      style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
                    >
                      {devResult.result.revisedDraft}
                    </p>
                    <p className="mt-1.5 text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                      A suggestion only. Nothing is saved or sent unless you copy and use it.
                    </p>
                  </div>
                ) : null}

                <div
                  className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5 text-[10.5px]"
                  style={{ borderColor: "var(--app-line)", color: "var(--app-muted)" }}
                >
                  <AiMetaNote meta={devResult.meta} />
                  <span>
                    {devResult.result.usesApprovedExamples && devResult.context.examplesEnabled
                      ? `${devResult.context.examplesSupplied.length} approved example${devResult.context.examplesSupplied.length === 1 ? "" : "s"} used`
                      : "Preferences only; no approved examples used"}
                  </span>
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Recent knowledge activity"
              description="Records you saved to this account, newest first."
              action={<History size={15} style={{ color: "var(--app-muted)" }} aria-label="History" />}
            />
            <ol className="mt-3 space-y-0">
              {activity.map((entry, index) => (
                <li key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: index === 0 ? "var(--app-gold)" : "var(--app-line-strong)" }}
                      aria-hidden="true"
                    />
                    {index < activity.length - 1 ? (
                      <span className="w-px flex-1" style={{ backgroundColor: "var(--app-line)" }} aria-hidden="true" />
                    ) : null}
                  </div>
                  <div className={index < activity.length - 1 ? "pb-4" : ""}>
                    <p className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                      {entry.date} · {entry.type}
                    </p>
                    <p className="mt-0.5 text-[12.5px] font-semibold">{entry.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
                      {entry.description}
                    </p>
                  </div>
                </li>
              ))}
              {activity.length === 0 ? (
                <li className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                  No knowledge records yet. Save a preparation brief, refinement, or meeting
                  record to see it here.
                </li>
              ) : null}
            </ol>
          </Card>
        </div>
      </div>

      <Card id="how-it-works" soft className="mt-4 p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <Sprout size={15} style={{ color: "var(--app-forest)" }} aria-hidden="true" />
          <h2 className="font-heading text-[18px]">How development works here</h2>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "You approve the material",
              body: "Examples and preferences enter this page only because you chose them. Nothing is collected from your messages in the background.",
            },
            {
              step: "02",
              title: "The workspace follows it",
              body: "Refinement reads the tone, structure, and approved examples above. It can explain which preference shaped a suggestion.",
            },
            {
              step: "03",
              title: "You can change it",
              body: "Turning examples off or resetting preferences takes effect immediately. There is no trained profile to undo.",
            },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-md border px-3.5 py-3"
              style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel)" }}
            >
              <p className="app-eyebrow">{item.step}</p>
              <p className="mt-1.5 text-[12.5px] font-semibold">{item.title}</p>
              <p className="mt-1 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
                {item.body}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
          <Info size={13} className="mt-0.5 shrink-0" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
          This workspace does not train a model. There is no automatic learning, and no
          improvement happens without a preference or example you approved on this page.
        </p>
        <p className="mt-1.5 flex items-start gap-2 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
          <ShieldCheck size={13} className="mt-0.5 shrink-0" style={{ color: "var(--app-forest)" }} aria-hidden="true" />
          Approved examples are stored in your account and are not shared with other users.
        </p>
      </Card>
    </>
  );
}
