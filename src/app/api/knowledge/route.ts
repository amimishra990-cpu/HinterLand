import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { optionalText, requiredText } from "@/lib/validation";


const KINDS = new Set([
  "Meeting record",
  "Decision log",
  "Preparation brief",
  "Refinement",
]);

function stringArray(value: unknown, maxItems: number, maxLength: number) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .slice(0, maxItems)
    .map((item) => item.slice(0, maxLength));
}

function validateJsonSize(value: unknown) {
  try {
    return JSON.stringify(value).length <= 100000;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const body = (await request.json().catch(() => null)) as
    | {
        title?: unknown;
        type?: unknown;
        projectId?: unknown;
        meetingId?: unknown;
        meetingTitle?: unknown;
        meetingDate?: unknown;
        topic?: unknown;
        description?: unknown;
        content?: unknown;
        related?: unknown;
        approved?: unknown;
        preparation?: unknown;
        meetingRecord?: unknown;
      }
    | null;
  if (!body) return badRequest("A JSON body is required.");

  const title = typeof body.title === "string" ? body.title : "";
  const type = typeof body.type === "string" ? body.type : "";
  const topic = typeof body.topic === "string" ? body.topic : "";
  const description = typeof body.description === "string" ? body.description : "";
  const titleError = requiredText(title, "Title", 300);
  if (titleError) return badRequest(titleError);
  if (!KINDS.has(type)) return badRequest("Select a valid knowledge type.");
  const topicError = optionalText(topic, "Topic", 160);
  if (topicError) return badRequest(topicError);
  const descriptionError = optionalText(description, "Description", 5000);
  if (descriptionError) return badRequest(descriptionError);

  let projectId: string | null = null;
  if (typeof body.projectId === "string" && body.projectId) {
    const { data: project } = await context.supabase
      .from("projects")
      .select("id")
      .eq("id", body.projectId)
      .eq("user_id", context.user.id)
      .maybeSingle();
    if (!project) return badRequest("Choose a project that belongs to your account.");
    projectId = project.id;
  }

  let meetingId: string | null = null;
  if (typeof body.meetingId === "string" && body.meetingId) {
    const { data: meeting } = await context.supabase
      .from("meetings")
      .select("id")
      .eq("id", body.meetingId)
      .eq("user_id", context.user.id)
      .maybeSingle();
    if (!meeting) return badRequest("Choose a meeting that belongs to your account.");
    meetingId = meeting.id;
  } else if (typeof body.meetingTitle === "string" && body.meetingTitle.trim()) {
    const meetingTitle = body.meetingTitle.trim().slice(0, 200);
    const { data: existing } = await context.supabase
      .from("meetings")
      .select("id")
      .eq("user_id", context.user.id)
      .eq("title", meetingTitle)
      .maybeSingle();
    if (existing) {
      meetingId = existing.id;
    } else {
      const dateValue =
        typeof body.meetingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.meetingDate)
          ? `${body.meetingDate}T09:00:00.000Z`
          : null;
      const { data: created, error: meetingError } = await context.supabase
        .from("meetings")
        .insert({
          user_id: context.user.id,
          project_id: projectId,
          title: meetingTitle,
          objective: description.slice(0, 5000),
          scheduled_start: dateValue,
          scheduled_end: dateValue
            ? new Date(new Date(dateValue).getTime() + 45 * 60 * 1000).toISOString()
            : null,
        })
        .select("id")
        .single();
      if (meetingError) {
        console.error("Meeting creation failed", meetingError.message);
        return serverError("The meeting could not be created for this record.");
      }
      meetingId = created.id;
    }
  }

  if (body.preparation !== undefined && !validateJsonSize(body.preparation)) {
    return badRequest("The preparation brief is too large.");
  }
  if (body.meetingRecord !== undefined && !validateJsonSize(body.meetingRecord)) {
    return badRequest("The meeting record is too large.");
  }

  const content = stringArray(body.content, 200, 10000);
  const related = stringArray(body.related, 50, 300);
  const approved = body.approved === true;
  const entryDate = new Date().toISOString().slice(0, 10);

  const { data: created, error } = await context.supabase
    .from("knowledge_entries")
    .insert({
      user_id: context.user.id,
      project_id: projectId,
      meeting_id: meetingId,
      title: title.trim(),
      kind: type,
      topic: topic.trim(),
      description: description.trim(),
      content,
      related,
      approved,
      approved_at: approved ? new Date().toISOString() : null,
      entry_date: entryDate,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Knowledge insert failed", error.message);
    return serverError("The record could not be saved.");
  }

  if (type === "Preparation brief" && body.preparation && typeof body.preparation === "object") {
    const preparation = body.preparation as { objective?: unknown; brief?: unknown };
    const { error: preparationError } = await context.supabase
      .from("meeting_preparations")
      .insert({
        user_id: context.user.id,
        meeting_id: meetingId,
        project_id: projectId,
        objective:
          typeof preparation.objective === "string"
            ? preparation.objective.slice(0, 5000)
            : description.slice(0, 5000),
        brief:
          preparation.brief && typeof preparation.brief === "object"
            ? preparation.brief
            : {},
        content,
        status: approved ? "approved" : "draft",
      });
    if (preparationError) {
      console.error("Preparation insert failed", preparationError.message);
    }
  }

  if (type === "Meeting record") {
    const detail = body.meetingRecord as { summary?: unknown } | undefined;
    const { error: recordError } = await context.supabase
      .from("meeting_records")
      .insert({
        user_id: context.user.id,
        meeting_id: meetingId,
        project_id: projectId,
        title: title.trim().slice(0, 300),
        summary:
          detail && typeof detail.summary === "string"
            ? detail.summary.slice(0, 10000)
            : description.slice(0, 10000),
        content,
        status: approved ? "approved" : "draft",
        approved_at: approved ? new Date().toISOString() : null,
      });
    if (recordError) {
      console.error("Meeting record insert failed", recordError.message);
    }
  }

  return NextResponse.json({ id: created.id }, { status: 201 });
}
