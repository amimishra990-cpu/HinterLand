import { z } from "zod";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
} from "@/lib/api";
import { assembleContext } from "@/lib/ai/context";
import { aiFailure, noStore, parseBody } from "@/lib/ai/http";
import { runStructured } from "@/lib/ai/orchestrator";
import { refinementPrompt } from "@/lib/ai/prompts";
import { refinementSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  draft: z.string().trim().min(1).max(20_000),
  intention: z.string().max(1_000).default(""),
  audience: z.string().max(300).default(""),
  channel: z.string().max(100).default("Email"),
  tone: z.string().max(80).default("Professional"),
  projectId: z.string().uuid().nullish(),
  documentIds: z.array(z.string().uuid()).max(5).default([]),
  knowledgeIds: z.array(z.string().uuid()).max(5).default([]),
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
    });
    const prompt = refinementPrompt({
      draft: input.draft,
      intention: input.intention,
      audience: input.audience,
      channel: input.channel,
      tone: input.tone,
      contextText: packet.text,
    });

    const run = await runStructured({
      supabase: context.supabase,
      userId: context.user.id,
      feature: "communication",
      task: "refine",
      projectId: input.projectId ?? null,
      inputRefs: {
        documentIds: input.documentIds,
        knowledgeIds: input.knowledgeIds,
        draftChars: input.draft.length,
        hasIntention: input.intention.length > 0,
      },
      system: prompt.system,
      user: prompt.user,
      schema: refinementSchema,
      maxOutputTokens: 3_000,
      temperature: 0.3,
    });

    return noStore({
      result: run.data,
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
