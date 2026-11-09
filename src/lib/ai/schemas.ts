import "server-only";

import { z } from "zod";

const shortText = (max: number) => z.string().trim().min(1).max(max);

/* -------------------------------------------------------------------------- */
/* Communication refinement                                                   */
/* -------------------------------------------------------------------------- */

export const refinementSchema = z.object({
  subject: z.string().max(300).nullable().default(null),
  refined: shortText(20_000),
  alternative: shortText(20_000),
  intention: shortText(1_000),
  improvements: z.array(z.string().max(600)).max(12).default([]),
  warnings: z
    .array(
      z.object({
        phrase: z.string().max(300),
        issue: z.string().max(600),
        suggestion: z.string().max(900),
      })
    )
    .max(12)
    .default([]),
  changes: z
    .array(
      z.object({
        before: z.string().max(2_000),
        after: z.string().max(3_000),
        reason: z.string().max(600),
      })
    )
    .max(12)
    .default([]),
  unsupportedClaims: z.array(z.string().max(600)).max(10).default([]),
});

export type RefinementOutput = z.infer<typeof refinementSchema>;

/* -------------------------------------------------------------------------- */
/* Meeting preparation                                                        */
/* -------------------------------------------------------------------------- */

export const preparationSchema = z.object({
  overview: shortText(6_000),
  talkingPoints: z
    .array(
      z.object({
        title: shortText(300),
        detail: shortText(2_000),
        source: z.string().max(300).nullable().default(null),
        evidence: z.string().max(2_000).nullable().default(null),
      })
    )
    .max(16)
    .default([]),
  questions: z
    .array(
      z.object({
        question: shortText(500),
        why: shortText(800),
      })
    )
    .max(16)
    .default([]),
  missing: z.array(z.string().max(600)).max(16).default([]),
  risks: z.array(z.string().max(800)).max(16).default([]),
  sequence: z.array(z.string().max(600)).max(16).default([]),
});

export type PreparationOutput = z.infer<typeof preparationSchema>;

/* -------------------------------------------------------------------------- */
/* Meeting intelligence                                                       */
/* -------------------------------------------------------------------------- */

export const meetingRecordSchema = z.object({
  summary: shortText(6_000),
  discussion: z
    .array(
      z.object({
        text: shortText(2_000),
        evidence: z.string().max(2_000).nullable().default(null),
      })
    )
    .max(24)
    .default([]),
  decisions: z
    .array(
      z.object({
        text: shortText(1_500),
        evidence: z.string().max(2_000).nullable().default(null),
      })
    )
    .max(20)
    .default([]),
  questions: z.array(z.string().max(800)).max(20).default([]),
  actions: z
    .array(
      z.object({
        task: shortText(1_000),
        owner: z.string().max(200).nullable().default(null),
        due: z.string().max(200).nullable().default(null),
        evidence: z.string().max(2_000).nullable().default(null),
      })
    )
    .max(24)
    .default([]),
});

export type MeetingRecordOutput = z.infer<typeof meetingRecordSchema>;

/* -------------------------------------------------------------------------- */
/* Document intelligence                                                      */
/* -------------------------------------------------------------------------- */

const citationSchema = z.object({
  documentId: z.string().max(80),
  quote: z.string().min(8).max(2_000),
});

export const documentSummarySchema = z.object({
  summary: shortText(8_000),
  keyPoints: z.array(z.string().max(1_000)).max(20).default([]),
  citations: z.array(citationSchema).max(20).default([]),
});

export const documentAnalysisSchema = z.object({
  summary: shortText(4_000),
  requirements: z.array(z.string().max(1_000)).max(20).default([]),
  risks: z.array(z.string().max(1_000)).max(20).default([]),
  inconsistencies: z.array(z.string().max(1_200)).max(20).default([]),
  missingInformation: z.array(z.string().max(1_000)).max(20).default([]),
  citations: z.array(citationSchema).max(20).default([]),
});

export const documentComparisonSchema = z.object({
  summary: shortText(4_000),
  agreements: z.array(z.string().max(1_200)).max(20).default([]),
  differences: z
    .array(
      z.object({
        topic: shortText(300),
        detail: shortText(1_500),
        documents: z.array(z.string().max(300)).max(8).default([]),
      })
    )
    .max(20)
    .default([]),
  conflicts: z.array(z.string().max(1_500)).max(20).default([]),
  missingFromOneDocument: z.array(z.string().max(1_000)).max(20).default([]),
  citations: z.array(citationSchema).max(20).default([]),
});

export const documentAnswerSchema = z.object({
  answer: shortText(6_000),
  insufficientContext: z.boolean().default(false),
  citations: z.array(citationSchema).max(20).default([]),
  followUps: z.array(z.string().max(500)).max(8).default([]),
});

/* -------------------------------------------------------------------------- */
/* Development                                                                */
/* -------------------------------------------------------------------------- */

export const developmentSchema = z.object({
  consistency: z
    .array(
      z.object({
        aspect: shortText(120),
        status: z.enum(["aligned", "drift", "unclear"]),
        detail: shortText(900),
      })
    )
    .max(12)
    .default([]),
  suggestions: z
    .array(
      z.object({
        title: shortText(200),
        detail: shortText(1_200),
      })
    )
    .max(12)
    .default([]),
  revisedDraft: z.string().max(20_000).nullable().default(null),
  usesApprovedExamples: z.boolean().default(false),
});

/* -------------------------------------------------------------------------- */
/* Knowledge                                                                  */
/* -------------------------------------------------------------------------- */

export const knowledgeAnswerSchema = z.object({
  answer: shortText(6_000),
  insufficientContext: z.boolean().default(false),
  citations: z
    .array(
      z.object({
        knowledgeId: z.string().max(80),
        quote: z.string().min(6).max(1_200),
      })
    )
    .max(12)
    .default([]),
  related: z
    .array(
      z.object({
        knowledgeId: z.string().max(80),
        reason: z.string().max(400),
      })
    )
    .max(8)
    .default([]),
});
