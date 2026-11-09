import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  notFound,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/supabase/config";
import { isSourceKind } from "@/lib/workspace-types";

const MAX_TEXT = 50000;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  const { data: document, error: lookupError } = await context.supabase
    .from("documents")
    .select("id, storage_path, file_type")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Document lookup failed", lookupError.message);
    return serverError("The source could not be updated.");
  }
  if (!document) return notFound("Source not found.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("A JSON body is required.");
  }
  const payload = (body ?? {}) as Record<string, unknown>;

  const update: Record<string, unknown> = {};

  if (payload.name !== undefined) {
    const name = typeof payload.name === "string" ? payload.name.trim() : "";
    if (!name) return badRequest("Add a name for the source.");
    if (name.length > 240) return badRequest("The name is too long.");
    update.name = name;
  }

  if (payload.sourceKind !== undefined) {
    if (!isSourceKind(payload.sourceKind)) return badRequest("Choose a valid source label.");
    update.source_kind = payload.sourceKind;
  }

  if (payload.projectId !== undefined) {
    const projectIdRaw =
      typeof payload.projectId === "string" ? payload.projectId.trim() : "";
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
      update.project_id = project.id;
    } else {
      update.project_id = null;
    }
  }

  if (payload.text !== undefined) {
    if (document.storage_path) {
      return badRequest("Only pasted context can be edited. Re-upload a file to change its contents.");
    }
    const text = typeof payload.text === "string" ? payload.text.trim() : "";
    if (!text) return badRequest("Pasted context cannot be empty.");
    if (text.length > MAX_TEXT) {
      return badRequest(`Pasted context must be ${MAX_TEXT.toLocaleString()} characters or fewer.`);
    }
    update.extracted_text = text;
    update.excerpt = text.slice(0, 2400);
    update.size_bytes = Math.min(new TextEncoder().encode(text).length, MAX_TEXT * 4);
    update.page_count = 1;
    update.status = "Ready";
    update.processing_error = null;
    update.processed_at = new Date().toISOString();
    update.extraction_method = "manual";
    update.analysis = {
      summary: "Text was added manually. No automated analysis has been run yet.",
      findings: ["Text entered manually."],
      gaps: [],
    };
  }

  if (Object.keys(update).length === 0) return badRequest("Nothing to update.");

  const { error } = await context.supabase
    .from("documents")
    .update(update)
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (error) {
    console.error("Document update failed", error.message);
    return serverError("The source could not be updated.");
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  const { data: document, error: lookupError } = await context.supabase
    .from("documents")
    .select("id, storage_path")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Document lookup failed", lookupError.message);
    return serverError("The document could not be removed.");
  }
  if (!document) return notFound("Document not found.");

  if (document.storage_path) {
    const { error: storageError } = await context.supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove([document.storage_path]);
    if (storageError) {
      console.error("Storage delete failed", storageError.message);
      return serverError("The stored file could not be deleted.");
    }
  }

  const { error } = await context.supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id);

  if (error) {
    console.error("Document delete failed", error.message);
    return serverError("The document record could not be deleted.");
  }

  return NextResponse.json({ ok: true });
}
