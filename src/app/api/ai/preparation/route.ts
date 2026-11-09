import { z } from "zod";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
} from "@/lib/api";
import { assembleContext } from "@/lib/ai/context";
import { quoteIsSupported } from "@/lib/ai/grounding";
import { aiFailure, noStore, parseBody } from "@/lib/ai/http";
import { runStructured } from "@/lib/ai/orchestrator";
import { preparationPrompt } from "@/lib/ai/prompts";
import { preparationSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  objective: z.string().max(5_000).default(""),
  agenda: z.string().max(20_000).default(""),
  previousNotes: z.string().max(20_000).default(""),
  date: z.string().max(40).default(""),
  projectId: z.string().uuid().nullish(),
  documentIds: z.array(z.string().uuid()).max(8).default([]),
  knowledgeIds: z.array(z.string().uuid()).max(8).default([]),
});

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
      knowledgeIds: input.knowledgeIds,
      includeRecentKnowledge: input.knowledgeIds.length === 0,
      includeMeetings: true,
      includeActions: true,
    });
    const prompt = preparationPrompt({
      title: input.title,
      objective: input.objective,
      date: input.date,
      agenda: input.agenda,
      previousNotes: input.previousNotes,
      contextText: packet.text,
    });

    const run = await runStructured({
      supabase: context.supabase,
      userId: context.user.id,
      feature: "preparation",
      task: "prepare",
      projectId: input.projectId ?? null,
      inputRefs: {
        documentIds: input.documentIds,
        knowledgeIds: input.knowledgeIds,
        agendaChars: input.agenda.length,
        objectiveChars: input.objective.length,
        previousNotesChars: input.previousNotes.length,
      },
      system: prompt.system,
      user: prompt.user,
      schema: preparationSchema,
      maxOutputTokens: 4_000,
      temperature: 0.2,
    });

    const grounding = run.data.talkingPoints.map((point, index) => {
      const verified = quoteIsSupported(point.evidence, [
        ...packet.sourceTexts,
        ...(input.previousNotes.trim() ? [input.previousNotes] : []),
      ]);
      return {
        index,
        grounded: verified,
        source: verified ? point.source ?? "Supplied source" : null,
      };
    });

    const brief = {
      overview: run.data.overview,
      talkingPoints: run.data.talkingPoints.map((point, index) => ({
        title: point.title,
        detail: point.detail,
        source: grounding[index]?.source ?? "Suggestion — not stated in the supplied sources",
      })),
      questions: run.data.questions,
      missing: run.data.missing,
      risks: run.data.risks,
      sequence: run.data.sequence,
    };

    return noStore({
      brief,
      grounding,
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
