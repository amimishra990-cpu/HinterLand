import { z } from "zod";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
} from "@/lib/api";
import { assembleContext, type ContextPacket } from "@/lib/ai/context";
import { pageNumberForQuote, quoteIsSupported } from "@/lib/ai/grounding";
import { aiFailure, noStore, parseBody } from "@/lib/ai/http";
import { runStructured } from "@/lib/ai/orchestrator";
import {
  documentAnalysisPrompt,
  documentComparisonPrompt,
  documentQuestionPrompt,
  documentSummaryPrompt,
} from "@/lib/ai/prompts";
import {
  documentAnalysisSchema,
  documentAnswerSchema,
  documentComparisonSchema,
  documentSummarySchema,
} from "@/lib/ai/schemas";

const documentIds = z.array(z.string().uuid()).max(8);
const projectId = z.string().uuid().nullish();

const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("summarize"),
    documentIds: documentIds.min(1),
    projectId,
  }),
  z.object({
    action: z.literal("analyze"),
    documentIds: documentIds.min(1),
    projectId,
    persist: z.boolean().default(false),
  }),
  z.object({
    action: z.literal("compare"),
    documentIds: documentIds.min(2),
    projectId,
  }),
  z.object({
    action: z.literal("qa"),
    documentIds: documentIds.min(1),
    projectId,
    question: z.string().trim().min(1).max(2_000),
  }),
]);

type RawCitation = { documentId: string; quote: string };

function verifyCitations(citations: RawCitation[], packet: ContextPacket) {
  let unverifiedCount = 0;
  const verified: {
    documentId: string;
    documentName: string;
    quote: string;
    pageNumber: number | null;
  }[] = [];

  for (const citation of citations) {
    const document = packet.documentTexts[citation.documentId];
    if (!document || !quoteIsSupported(citation.quote, [document.text])) {
      unverifiedCount += 1;
      continue;
    }
    verified.push({
      documentId: citation.documentId,
      documentName: document.name,
      quote: citation.quote,
      pageNumber: pageNumberForQuote(document.text, citation.quote),
    });
  }

  return { citations: verified, unverifiedCount };
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const parsed = parseBody(requestSchema, await request.json().catch(() => null));
  if (!parsed.ok) return badRequest(parsed.message);
  const input = parsed.data;

  try {
    const packet = await assembleContext(context.supabase, context.user.id, {
      projectId: input.projectId ?? null,
      documentIds: input.documentIds,
    });
    const names = input.documentIds
      .map((id) => packet.documentTexts[id]?.name)
      .filter((name): name is string => Boolean(name));

    if (names.length === 0) {
      return badRequest(
        "Select at least one document that belongs to your account and contains extractable text."
      );
    }
    if (input.action === "compare" && names.length < 2) {
      return badRequest("Select at least two documents that contain extractable text.");
    }

    const inputRefs = {
      documentIds: input.documentIds,
      documentCount: input.documentIds.length,
      action: input.action,
      ...(input.action === "qa" ? { questionChars: input.question.length } : {}),
    };

    if (input.action === "summarize") {
      const prompt = documentSummaryPrompt(packet.text, names);
      const run = await runStructured({
        supabase: context.supabase,
        userId: context.user.id,
        feature: "document",
        task: "summarize",
        projectId: input.projectId ?? null,
        inputRefs,
        system: prompt.system,
        user: prompt.user,
        schema: documentSummarySchema,
        maxOutputTokens: 3_000,
        temperature: 0.1,
      });
      const citations = verifyCitations(run.data.citations, packet);
      return noStore({
        action: input.action,
        summary: run.data.summary,
        keyPoints: run.data.keyPoints,
        ...citations,
        meta: run.meta,
        context: {
          sources: packet.sources,
          omitted: packet.omitted,
          truncated: packet.truncated,
          estimatedTokens: packet.estimatedTokens,
        },
      });
    }

    if (input.action === "analyze") {
      const prompt = documentAnalysisPrompt(packet.text, names);
      const run = await runStructured({
        supabase: context.supabase,
        userId: context.user.id,
        feature: "document",
        task: "analyze",
        projectId: input.projectId ?? null,
        inputRefs,
        system: prompt.system,
        user: prompt.user,
        schema: documentAnalysisSchema,
        maxOutputTokens: 4_000,
        temperature: 0.1,
      });
      const citations = verifyCitations(run.data.citations, packet);

      if (input.persist && input.documentIds.length === 1) {
        const documentId = input.documentIds[0];
        const { error } = await context.supabase
          .from("documents")
          .update({
            analysis: {
              summary: run.data.summary,
              findings: [
                ...run.data.requirements,
                ...run.data.risks,
                ...run.data.inconsistencies,
              ],
              gaps: run.data.missingInformation,
            },
            status: citations.unverifiedCount > 0 ? "Needs review" : "Ready",
          })
          .eq("id", documentId)
          .eq("user_id", context.user.id);
        if (error) console.error("Document analysis save failed", error.code);
      }

      return noStore({
        action: input.action,
        analysis: run.data,
        ...citations,
        meta: run.meta,
        context: {
          sources: packet.sources,
          omitted: packet.omitted,
          truncated: packet.truncated,
          estimatedTokens: packet.estimatedTokens,
        },
      });
    }

    if (input.action === "compare") {
      const prompt = documentComparisonPrompt(packet.text, names);
      const run = await runStructured({
        supabase: context.supabase,
        userId: context.user.id,
        feature: "document",
        task: "compare",
        projectId: input.projectId ?? null,
        inputRefs,
        system: prompt.system,
        user: prompt.user,
        schema: documentComparisonSchema,
        maxOutputTokens: 4_000,
        temperature: 0.1,
      });
      const citations = verifyCitations(run.data.citations, packet);
      return noStore({
        action: input.action,
        comparison: run.data,
        ...citations,
        meta: run.meta,
        context: {
          sources: packet.sources,
          omitted: packet.omitted,
          truncated: packet.truncated,
          estimatedTokens: packet.estimatedTokens,
        },
      });
    }

    const prompt = documentQuestionPrompt(packet.text, input.question, names);
    const run = await runStructured({
      supabase: context.supabase,
      userId: context.user.id,
      feature: "document",
      task: "qa",
      projectId: input.projectId ?? null,
      inputRefs,
      system: prompt.system,
      user: prompt.user,
      schema: documentAnswerSchema,
      maxOutputTokens: 3_000,
      temperature: 0.1,
    });
    const citations = verifyCitations(run.data.citations, packet);
    return noStore({
      action: input.action,
      answer: run.data.answer,
      insufficientContext: run.data.insufficientContext,
      followUps: run.data.followUps,
      ...citations,
      meta: run.meta,
      context: {
        sources: packet.sources,
        omitted: packet.omitted,
        truncated: packet.truncated,
        estimatedTokens: packet.estimatedTokens,
      },
    });
  } catch (error) {
    return aiFailure(error);
  }
}
