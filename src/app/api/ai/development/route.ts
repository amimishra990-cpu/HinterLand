import { z } from "zod";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
} from "@/lib/api";
import { loadAuthorizedProject } from "@/lib/ai/context";
import { aiFailure, noStore, parseBody } from "@/lib/ai/http";
import { runStructured } from "@/lib/ai/orchestrator";
import { developmentPrompt } from "@/lib/ai/prompts";
import { developmentSchema } from "@/lib/ai/schemas";
import { DEFAULT_WRITING_PREFERENCES } from "@/lib/workspace-types";

const requestSchema = z.object({
  draft: z.string().trim().min(1).max(20_000),
  projectId: z.string().uuid().nullish(),
});

type PreferenceRow = {
  tone: string;
  structure: string;
  greeting: string;
  sign_off: string;
  preserve: string;
  use_examples: boolean;
};

type ExampleRow = { id: string; title: string; context: string; excerpt: string };

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

    const { data: preferenceData } = await context.supabase
      .from("writing_preferences")
      .select("tone, structure, greeting, sign_off, preserve, use_examples")
      .eq("user_id", context.user.id)
      .maybeSingle();
    const preferences = (preferenceData as PreferenceRow | null) ?? {
      tone: DEFAULT_WRITING_PREFERENCES.tone,
      structure: DEFAULT_WRITING_PREFERENCES.structure,
      greeting: DEFAULT_WRITING_PREFERENCES.greeting,
      sign_off: DEFAULT_WRITING_PREFERENCES.signOff,
      preserve: DEFAULT_WRITING_PREFERENCES.preserve,
      use_examples: DEFAULT_WRITING_PREFERENCES.useExamples,
    };

    let examples: ExampleRow[] = [];
    if (preferences.use_examples) {
      const { data } = await context.supabase
        .from("approved_writing_examples")
        .select("id, title, context, excerpt")
        .eq("user_id", context.user.id)
        .order("approved_at", { ascending: false })
        .limit(5);
      examples = (data ?? []) as ExampleRow[];
    }

    const preferenceText = [
      `Tone: ${preferences.tone}`,
      `Sentence structure: ${preferences.structure}`,
      `Greeting style: ${preferences.greeting}`,
      `Sign-off: ${preferences.sign_off || "Not specified"}`,
      `Always preserve: ${preferences.preserve || "Not specified"}`,
    ].join("\n");

    const examplesText =
      examples.length > 0
        ? examples
            .map(
              (example, index) =>
                `Example ${index + 1}: ${example.title || "Untitled"}\nContext: ${
                  example.context || "Not specified"
                }\nText:\n${example.excerpt.slice(0, 1_200)}`
            )
            .join("\n\n")
        : "(No approved examples were supplied.)";

    const prompt = developmentPrompt({
      draft: input.draft,
      preferences: preferenceText,
      examples: examplesText,
    });

    const run = await runStructured({
      supabase: context.supabase,
      userId: context.user.id,
      feature: "development",
      task: "consistency-review",
      projectId: input.projectId ?? null,
      inputRefs: {
        draftChars: input.draft.length,
        examplesUsed: examples.map((example) => example.id),
        useExamples: preferences.use_examples,
      },
      system: prompt.system,
      user: prompt.user,
      schema: developmentSchema,
      maxOutputTokens: 3_500,
      temperature: 0.3,
    });

    return noStore({
      result: run.data,
      meta: run.meta,
      context: {
        preferences: {
          tone: preferences.tone,
          structure: preferences.structure,
          greeting: preferences.greeting,
          signOff: preferences.sign_off,
          preserve: preferences.preserve,
        },
        examplesSupplied: examples.map((example) => ({
          id: example.id,
          title: example.title,
        })),
        examplesEnabled: preferences.use_examples,
      },
    });
  } catch (error) {
    return aiFailure(error);
  }
}
