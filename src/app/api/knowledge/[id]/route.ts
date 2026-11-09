import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  notFound,
  sameOrigin,
  serverError,
} from "@/lib/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as { approved?: unknown } | null;
  if (!body || typeof body.approved !== "boolean") {
    return badRequest("A boolean 'approved' value is required.");
  }

  const { data, error } = await context.supabase
    .from("knowledge_entries")
    .update({
      approved: body.approved,
      approved_at: body.approved ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Knowledge approval update failed", error.message);
    return serverError("The record could not be updated.");
  }
  if (!data) return notFound("Record not found.");

  return NextResponse.json({ ok: true });
}
