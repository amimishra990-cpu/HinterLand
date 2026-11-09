import { z } from "zod";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
} from "@/lib/api";
import { assembleContext } from "@/lib/ai/context";
import { groundOwnerAndDeadline, quoteIsSupported } from "@/lib/ai/grounding";
import { aiFailure, noStore, parseBody } from "@/lib/ai/http";
import { runStructured } from "@/lib/ai/orchestrator";
import { meetingRecordPrompt } from "@/lib/ai/prompts";
import { meetingRecordSchema } from "@/lib/ai/schemas";

const requestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  date: z.string().max(40).default(""),
  projectId: z.string().uuid().nullish(),
  notes: z.string().trim().min(1).max(100_000),
  sourceKind: z.enum(["Notes", "Transcript"]).default("Notes"),
  consent: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const parsed = parseBody(requestSchema, await request.json().catch(() => null));
  if (!parsed.ok) return badRequest(parsed.message);
  const input = parsed.data;
  if (input.sourceKind === "Transcript" && !input.consent) {
    return badRequest("Confirm that participants were informed before using a transcript.");
  }

  try {
    const packet = await assembleContext(context.supabase, context.user.id, {
      projectId: input.projectId ?? null,
      includeRecentKnowledge: true,
      includeMeetings: true,
      includeActions: true,
    });
    const prompt = meetingRecordPrompt({
      title: input.title,
      date: input.date,
      notes: input.notes,
      sourceKind: input.sourceKind,
      contextText: packet.text,
    });

    const run = await runStructured({
      supabase: context.supabase,
      userId: context.user.id,
      feature: "intelligence",
      task: "meeting-record",
      projectId: input.projectId ?? null,
      inputRefs: {
        notesChars: input.notes.length,
        sourceKind: input.sourceKind,
        meetingTitle: input.title.slice(0, 120),
      },
      system: prompt.system,
      user: prompt.user,
      schema: meetingRecordSchema,
      maxOutputTokens: 4_500,
      temperature: 0.1,
    });

    const notes = [input.notes];

    const discussion = run.data.discussion.map((item, index) => {
      const verified = quoteIsSupported(item.evidence, notes);
      return {
        index,
        text: item.text,
        evidence: verified ? item.evidence : null,
        verified,
      };
    });

    const decisions = run.data.decisions.map((item, index) => {
      const verified = quoteIsSupported(item.evidence, notes);
      return {
        index,
        text: item.text,
        evidence: verified ? item.evidence : null,
        verified,
      };
    });

    const actions = run.data.actions.map((action, index) => {
      const evidenceVerified = quoteIsSupported(action.evidence, notes);
      const grounded = groundOwnerAndDeadline(
        action.owner,
        action.due,
        action.evidence,
        evidenceVerified
      );
      return {
        index,
        task: action.task,
        owner: grounded.owner,
        due: grounded.due,
        evidence: evidenceVerified ? action.evidence : null,
        evidenceVerified,
        ownerSpecified: Boolean(action.owner),
        dueSpecified: Boolean(action.due),
        ownerVerified: grounded.ownerVerified,
        dueVerified: grounded.dueVerified,
      };
    });

    const record = {
      summary: run.data.summary,
      discussion: discussion.map((item) => item.text),
      decisions: decisions.map((item) => item.text),
      questions: run.data.questions,
      actions: actions.map(({ task, owner, due }) => ({ task, owner, due })),
      hasNotes: input.notes.trim().length > 0,
    };

    const unresolvedCommitments =
      decisions.some((item) => !item.verified) ||
      actions.some(
        (item) =>
          !item.evidenceVerified ||
          (item.ownerSpecified && !item.ownerVerified) ||
          (item.dueSpecified && !item.dueVerified)
      );

    const validation = {
      decisions,
      actions,
      discussion,
      blocked: unresolvedCommitments,
      ownerOrDeadlineBlanked: actions.some(
        (item) =>
          (item.ownerSpecified && !item.ownerVerified) ||
          (item.dueSpecified && !item.dueVerified)
      ),
    };

    return noStore({
      record,
      validation,
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
