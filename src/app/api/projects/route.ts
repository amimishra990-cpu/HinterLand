import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { optionalText, requiredText } from "@/lib/validation";

const STATUSES = new Set(["Active", "In review", "Paused"]);

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const body = (await request.json().catch(() => null)) as
    | {
        name?: unknown;
        description?: unknown;
        objective?: unknown;
        status?: unknown;
      }
    | null;
  if (!body) return badRequest("A JSON body is required.");

  const name = typeof body.name === "string" ? body.name : "";
  const description = typeof body.description === "string" ? body.description : "";
  const objective = typeof body.objective === "string" ? body.objective : "";
  const status = typeof body.status === "string" ? body.status : "Active";

  const nameError = requiredText(name, "Project name", 120);
  if (nameError) return badRequest(nameError);
  const objectiveError = requiredText(objective, "Objective", 5000);
  if (objectiveError) return badRequest(objectiveError);
  const descriptionError = optionalText(description, "Description", 5000);
  if (descriptionError) return badRequest(descriptionError);
  if (!STATUSES.has(status)) return badRequest("Select a valid project status.");

  const { data, error } = await context.supabase
    .from("projects")
    .insert({
      user_id: context.user.id,
      name: name.trim(),
      description: description.trim(),
      objective: objective.trim(),
      status,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A project with this name already exists." },
        { status: 409 }
      );
    }
    console.error("Project insert failed", error.message);
    return serverError("The project could not be created.");
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
