export const EXPERIENCE_SECTION_ID = "experience";

export type StoryStage = {
  id: string;
  number: string;
  title: string;
  description: string;
  note: string;
  chips: readonly string[];
  accent: "gold" | "terracotta" | "sage";
};

export const storyStages: readonly StoryStage[] = [
  {
    id: "scattered-information",
    number: "01",
    title: "Scattered information",
    description:
      "A message, a notebook, a project document, a calendar and a task sheet. Each holds a piece of the context. None of them knows the others.",
    note: "Nothing connects yet.",
    chips: ["Message", "Notebook", "Project document", "Calendar", "Task sheet"],
    accent: "terracotta",
  },
  {
    id: "communication",
    number: "02",
    title: "Communication",
    description:
      "The message moves forward. Its structure becomes clearer while the original wording, the stated intention and every commitment stay visible.",
    note: "Improvement never hides the source.",
    chips: ["Original kept", "Intention preserved", "Review required"],
    accent: "gold",
  },
  {
    id: "meeting-preparation",
    number: "03",
    title: "Meeting preparation",
    description:
      "The agenda and the documents that matter gather together. Talking points, questions and gaps appear as prompts for your judgement, not as answers.",
    note: "Gaps stay marked, never invented.",
    chips: ["Agenda source", "Talking points", "Questions", "Gaps marked"],
    accent: "terracotta",
  },
  {
    id: "meeting-intelligence",
    number: "04",
    title: "Meeting intelligence",
    description:
      "Loose notes become a structured record: key points, decisions, open questions and actions. Missing owners and deadlines remain explicit.",
    note: "Placed in order. Traced to the notes.",
    chips: ["Decisions", "Actions", "Questions", "Not specified"],
    accent: "gold",
  },
  {
    id: "project-knowledge",
    number: "05",
    title: "Project knowledge",
    description:
      "Approved records connect to the documents they came from. One quiet thread carries the reasoning, the evidence and the decisions forward.",
    note: "Approved records only.",
    chips: ["Approved only", "Source visible", "Searchable later"],
    accent: "sage",
  },
  {
    id: "connected-workspace",
    number: "06",
    title: "The connected workspace",
    description:
      "Every object settles into place. Context, conversation and decisions remain connected — reviewable, traceable and still yours.",
    note: "Assistance supports judgement, never replaces it.",
    chips: ["Connected", "Traceable", "Human approval"],
    accent: "gold",
  },
] as const;

export const STAGE_COUNT = storyStages.length;

export type SceneStageKey = (typeof storyStages)[number]["id"];
