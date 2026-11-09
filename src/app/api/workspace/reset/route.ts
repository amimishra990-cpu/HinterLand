import { NextResponse } from "next/server";

import {
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/supabase/config";
import { DEFAULT_WRITING_PREFERENCES } from "@/lib/workspace-types";


export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { data: documents } = await context.supabase
    .from("documents")
    .select("storage_path")
    .eq("user_id", context.user.id);

  const paths = (documents ?? [])
    .map((row) => row.storage_path as string | null)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error: storageError } = await context.supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove(paths);
    if (storageError) {
      console.error("Workspace reset storage cleanup failed", storageError.message);
    }
  }

  const tables = [
    "meeting_preparations",
    "meeting_records",
    "documents",
    "decisions",
    "action_items",
    "knowledge_entries",
    "meetings",
    "projects",
    "approved_writing_examples",
  ] as const;

  for (const table of tables) {
    const { error } = await context.supabase
      .from(table)
      .delete()
      .eq("user_id", context.user.id);
    if (error) {
      console.error(`Workspace reset failed for ${table}`, error.message);
      return serverError("The workspace could not be fully reset.");
    }
  }

  await context.supabase.from("writing_preferences").upsert(
    {
      user_id: context.user.id,
      tone: DEFAULT_WRITING_PREFERENCES.tone,
      structure: DEFAULT_WRITING_PREFERENCES.structure,
      greeting: DEFAULT_WRITING_PREFERENCES.greeting,
      sign_off: DEFAULT_WRITING_PREFERENCES.signOff,
      preserve: DEFAULT_WRITING_PREFERENCES.preserve,
      use_examples: DEFAULT_WRITING_PREFERENCES.useExamples,
    },
    { onConflict: "user_id" }
  );

  return NextResponse.json({ ok: true });
}
