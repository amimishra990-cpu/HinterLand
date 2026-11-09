import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { isSourceKind } from "@/lib/workspace-types";

const MAX_TEXT = 50000;
const MAX_UPLOADS_PER_HOUR = 40;

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { count: recentSources } = await context.supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.user.id)
    .gte("uploaded_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if ((recentSources ?? 0) >= MAX_UPLOADS_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many sources added in the last hour. Try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("A JSON body is required.");
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const text = typeof payload.text === "string" ? payload.text.trim() : "";
  const sourceKindRaw = typeof payload.sourceKind === "string" ? payload.sourceKind : "Note";
  const sourceKind = isSourceKind(sourceKindRaw) ? sourceKindRaw : "Note";

  if (!name) return badRequest("Add a name for the pasted context.");
  if (name.length > 240) return badRequest("The name is too long.");
  if (!text) return badRequest("Paste some text before saving.");
  if (text.length > MAX_TEXT) {
    return badRequest(`Pasted context must be ${MAX_TEXT.toLocaleString()} characters or fewer.`);
  }

  const projectIdRaw = typeof payload.projectId === "string" ? payload.projectId.trim() : "";
  let projectId: string | null = null;
  if (projectIdRaw) {
    const { data: project, error: projectError } = await context.supabase
      .from("projects")
      .select("id")
      .eq("id", projectIdRaw)
      .eq("user_id", context.user.id)
      .maybeSingle();
    if (projectError) {
      console.error("Project lookup failed", projectError.message);
      return serverError("The project could not be verified.");
    }
    if (!project) return badRequest("Choose a project that belongs to your account.");
    projectId = project.id;
  }

  const { data: inserted, error } = await context.supabase
    .from("documents")
    .insert({
      user_id: context.user.id,
      project_id: projectId,
      name,
      file_type: "Notes",
      source_kind: sourceKind,
      status: "Ready",
      storage_path: null,
      size_bytes: Math.min(new TextEncoder().encode(text).length, MAX_TEXT * 4),
      page_count: 1,
      excerpt: text.slice(0, 2400),
      extracted_text: text,
      extraction_method: "manual",
      extraction_quality: {
        pageCount: 1,
        textPages: 1,
        scannedPages: 0,
        ocrPages: 0,
        lowConfidencePages: 0,
        uncertainPages: 0,
        duplicatePages: 0,
        emptyPages: 0,
        repeatedLinesRemoved: 0,
        truncated: false,
        warnings: [],
      },
      processed_at: new Date().toISOString(),
      analysis: {
        summary: "Text was added manually. No automated analysis has been run yet.",
        findings: ["Text entered manually."],
        gaps: [],
      },
    })
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Pasted source insert failed", error.message);
    return serverError("The pasted context could not be saved.");
  }

  return NextResponse.json({ id: inserted?.id ?? null }, { status: 201 });
}
