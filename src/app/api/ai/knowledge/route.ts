import { z } from "zod";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
} from "@/lib/api";
import {
  knowledgeToText,
  loadApprovedKnowledge,
  loadAuthorizedProject,
  type KnowledgeRow,
} from "@/lib/ai/context";
import { quoteIsSupported } from "@/lib/ai/grounding";
import { aiFailure, noStore, parseBody } from "@/lib/ai/http";
import { runStructured } from "@/lib/ai/orchestrator";
import { knowledgePrompt } from "@/lib/ai/prompts";
import { knowledgeAnswerSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  question: z.string().trim().min(1).max(1_000),
  projectId: z.string().uuid().nullish(),
});

const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "how",
  "did",
  "does",
  "was",
  "were",
  "are",
  "have",
  "has",
  "had",
  "our",
  "their",
  "about",
  "into",
  "over",
  "under",
  "any",
  "all",
  "can",
  "could",
  "would",
  "should",
  "there",
  "these",
  "those",
  "you",
  "your",
]);

function terms(value: string) {
  return Array.from(
    new Set(
      value
        .normalize("NFKC")
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((word) => word.length >= 3 && !STOPWORDS.has(word))
    )
  ).slice(0, 24);
}

function scoreRecord(record: KnowledgeRow, queryTerms: string[]) {
  const title = record.title.toLowerCase();
  const topic = record.topic.toLowerCase();
  const body = [record.description, ...record.content].join(" ").toLowerCase();
  let score = 0;
  for (const term of queryTerms) {
    if (title.includes(term)) score += 4;
    if (topic.includes(term)) score += 2;
    if (body.includes(term)) score += 1;
  }
  return score;
}

function recordBlock(record: KnowledgeRow) {
  return `[RECORD id="${record.id}" kind="${record.kind}" date="${record.entry_date}"]\n${knowledgeToText(
    record
  ).slice(0, 3_000)}\n[END RECORD]`;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const parsed = parseBody(requestSchema, await request.json().catch(() => null));
  if (!parsed.ok) return badRequest(parsed.message);
  const input = parsed.data;

  try {
    if (input.projectId) {
      const project = await loadAuthorizedProject(
        context.supabase,
        context.user.id,
        input.projectId
      );
      if (!project) return badRequest("Choose a project that belongs to your account.");
    }

    const { records } = await loadApprovedKnowledge(context.supabase, context.user.id, {
      projectId: input.projectId ?? null,
      limit: 200,
    });

    if (records.length === 0) {
      return noStore({
        answer:
          "There are no approved records in your knowledge repository yet. Approve a meeting record, preparation brief, decision, or refinement first, then ask again.",
        insufficientContext: true,
        citations: [],
        related: [],
        retrieved: [],
        retrieval: "none",
        meta: null,
        context: { recordCount: 0 },
      });
    }

    const queryTerms = terms(input.question);
    const scored = records
      .map((record) => ({ record, score: scoreRecord(record, queryTerms) }))
      .sort((a, b) => b.score - a.score);

    const matched = scored.filter((entry) => entry.score > 0).slice(0, 10);
    const selected =
      matched.length >= 3 ? matched : scored.slice(0, 8).map((entry) => ({ ...entry, score: entry.score }));
    const retrieval = matched.length >= 3 ? "keyword" : "recent";
    const included = selected.map((entry) => entry.record);

    const contextText = included.map(recordBlock).join("\n\n");
    const prompt = knowledgePrompt({ question: input.question, contextText: contextText });

    const run = await runStructured({
      supabase: context.supabase,
      userId: context.user.id,
      feature: "knowledge",
      task: "question",
      projectId: input.projectId ?? null,
      inputRefs: {
        questionChars: input.question.length,
        recordIds: included.map((record) => record.id),
        retrieval,
      },
      system: prompt.system,
      user: prompt.user,
      schema: knowledgeAnswerSchema,
      maxOutputTokens: 3_000,
      temperature: 0.1,
    });

    const byId = new Map(included.map((record) => [record.id, record]));
    const citations = run.data.citations
      .map((citation) => {
        const record = byId.get(citation.knowledgeId);
        if (!record || !quoteIsSupported(citation.quote, [knowledgeToText(record)])) {
          return null;
        }
        return {
          knowledgeId: record.id,
          title: record.title,
          kind: record.kind,
          quote: citation.quote,
        };
      })
      .filter((citation): citation is NonNullable<typeof citation> => Boolean(citation));

    const related = run.data.related
      .map((item) => {
        const record = byId.get(item.knowledgeId);
        return record ? { knowledgeId: record.id, title: record.title, reason: item.reason } : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item));

    return noStore({
      answer: run.data.answer,
      insufficientContext: run.data.insufficientContext || citations.length === 0,
      citations,
      related,
      retrieved: included.map((record) => ({
        id: record.id,
        title: record.title,
        kind: record.kind,
        date: record.entry_date,
      })),
      retrieval,
      meta: run.meta,
      context: {
        recordCount: included.length,
        approvedRecordCount: records.length,
        totalChars: contextText.length,
        unverifiedCitationCount: run.data.citations.length - citations.length,
      },
    });
  } catch (error) {
    return aiFailure(error);
  }
}
