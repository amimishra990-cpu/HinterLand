import { NextResponse } from "next/server";

import { badRequest, getApiContext, serverError } from "@/lib/api";

export async function GET(request: Request) {
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const hash = (new URL(request.url).searchParams.get("hash") ?? "").trim().toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) {
    return badRequest("A valid file fingerprint is required.");
  }

  const { data, error } = await context.supabase
    .from("documents")
    .select("id, name, status, file_type, page_count, uploaded_at")
    .eq("user_id", context.user.id)
    .eq("content_hash", hash)
    .maybeSingle();

  if (error) {
    console.error("Content hash lookup failed", error.message);
    return serverError("The document library could not be checked for duplicates.");
  }

  return NextResponse.json({
    document: data
      ? {
          id: data.id,
          name: data.name,
          status: data.status,
          fileType: data.file_type,
          pageCount: data.page_count,
          uploadedAt: data.uploaded_at,
        }
      : null,
  });
}
