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
  const body = (await request.json().catch(() => null)) as { done?: unknown } | null;
  if (!body || typeof body.done !== "boolean") {
    return badRequest("A boolean 'done' value is required.");
  }

  const { data, error } = await context.supabase
    .from("action_items")
    .update({
      done: body.done,
      completed_at: body.done ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Action update failed", error.message);
    return serverError("The action item could not be updated.");
  }
  if (!data) return notFound("Action item not found.");

  return NextResponse.json({ ok: true });
}
