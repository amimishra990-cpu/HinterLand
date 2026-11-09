import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { optionalText, requiredText } from "@/lib/validation";

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return badRequest("A JSON body is required.");

  const tone = typeof body.tone === "string" ? body.tone : "";
  const structure = typeof body.structure === "string" ? body.structure : "";
  const greeting = typeof body.greeting === "string" ? body.greeting : "";
  const signOff = typeof body.signOff === "string" ? body.signOff : "";
  const preserve = typeof body.preserve === "string" ? body.preserve : "";
  const useExamples = body.useExamples;

  const toneError = requiredText(tone, "Tone", 80);
  if (toneError) return badRequest(toneError);
  for (const [label, value, max] of [
    ["Structure", structure, 160],
    ["Greeting", greeting, 160],
    ["Sign-off", signOff, 160],
    ["Preserve instruction", preserve, 5000],
  ] as const) {
    const issue = optionalText(value, label, max);
    if (issue) return badRequest(issue);
  }
  if (typeof useExamples !== "boolean") {
    return badRequest("useExamples must be a boolean.");
  }

  const { error } = await context.supabase.from("writing_preferences").upsert(
    {
      user_id: context.user.id,
      tone: tone.trim(),
      structure: structure.trim(),
      greeting: greeting.trim(),
      sign_off: signOff.trim(),
      preserve: preserve.trim(),
      use_examples: useExamples,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Writing preferences update failed", error.message);
    return serverError("Writing preferences could not be saved.");
  }

  return NextResponse.json({ ok: true });
}
