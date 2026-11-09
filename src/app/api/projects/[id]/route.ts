import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  notFound,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { optionalText, requiredText } from "@/lib/validation";

const STATUSES = new Set(["Active", "In review", "Paused"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  const { data: project, error: lookupError } = await context.supabase
    .from("projects")
    .select("id")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (lookupError) {
    console.error("Project lookup failed", lookupError.message);
    return serverError("The project could not be updated.");
  }
  if (!project) return notFound("Project not found.");

  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        description?: unknown;
        objective?: unknown;
        status?: unknown;
        archived?: unknown;
      }
    | null;
  if (!body) return badRequest("A JSON body is required.");

  const update: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name : "";
    const nameError = requiredText(name, "Project name", 120);
    if (nameError) return badRequest(nameError);
    update.name = name.trim();
  }

  if (body.objective !== undefined) {
    const objective = typeof body.objective === "string" ? body.objective : "";
    const objectiveError = requiredText(objective, "Objective", 5000);
    if (objectiveError) return badRequest(objectiveError);
    update.objective = objective.trim();
  }

  if (body.description !== undefined) {
    const description = typeof body.description === "string" ? body.description : "";
    const descriptionError = optionalText(description, "Description", 5000);
    if (descriptionError) return badRequest(descriptionError);
    update.description = description.trim();
  }

  if (body.status !== undefined) {
    if (typeof body.status !== "string" || !STATUSES.has(body.status)) {
      return badRequest("Select a valid project status.");
    }
    update.status = body.status;
  }

  if (body.archived !== undefined) {
    if (typeof body.archived !== "boolean") {
      return badRequest("Archived must be true or false.");
    }
    update.archived_at = body.archived ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return badRequest("Nothing to update.");
  }

  const { data, error } = await context.supabase
    .from("projects")
    .update(update)
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A project with this name already exists." },
        { status: 409 }
      );
    }
    console.error("Project update failed", error.message);
    return serverError("The project could not be updated.");
  }
  if (!data) return notFound("Project not found.");

  return NextResponse.json({ ok: true, id: data.id });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  const { data, error } = await context.supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Project delete failed", error.message);
    return serverError("The project could not be deleted.");
  }
  if (!data) return notFound("Project not found.");

  return NextResponse.json({ ok: true, id: data.id });
}
