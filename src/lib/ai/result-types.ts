export type RefinementResult = {
  subject: string | null;
  refined: string;
  alternative: string;
  intention: string;
  improvements: string[];
  warnings: { phrase: string; issue: string; suggestion: string }[];
  changes: { before: string; after: string; reason: string }[];
};

export type PreparationBrief = {
  overview: string;
  talkingPoints: { title: string; detail: string; source: string }[];
  questions: { question: string; why: string }[];
  missing: string[];
  risks: string[];
  sequence: string[];
};

export type ExtractedAction = {
  task: string;
  owner: string | null;
  due: string | null;
};

export type MeetingRecordResult = {
  summary: string;
  discussion: string[];
  decisions: string[];
  questions: string[];
  actions: ExtractedAction[];
  hasNotes: boolean;
};
