import { NextResponse } from "next/server";

import {
  crossOriginResponse,
  getApiContext,
  notFound,
  sameOrigin,
  serverError,
} from "@/lib/api";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  const { data, error } = await context.supabase
    .from("approved_writing_examples")
    .delete()
    .eq("id", id)
    .eq("user_id", context.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Writing example delete failed", error.message);
    return serverError("The writing example could not be removed.");
  }
  if (!data) return notFound("Writing example not found.");

  return NextResponse.json({ ok: true });
}
