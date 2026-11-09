import { NextResponse } from "next/server";

import {
  getApiContext,
  notFound,
  serverError,
} from "@/lib/api";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/supabase/config";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  const { data: document, error } = await context.supabase
    .from("documents")
    .select("id, name, storage_path")
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (error) {
    console.error("Document download lookup failed", error.message);
    return serverError("The document could not be retrieved.");
  }
  if (!document) return notFound("Document not found.");
  if (!document.storage_path) {
    return notFound("This entry has no stored original file.");
  }

  const { data: signed, error: signError } = await context.supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .createSignedUrl(document.storage_path, 60, { download: document.name });

  if (signError || !signed) {
    console.error("Signed URL failed", signError?.message);
    return serverError("A secure download link could not be created.");
  }

  return NextResponse.json(
    { url: signed.signedUrl, expiresIn: 60 },
    { headers: { "Cache-Control": "no-store" } }
  );
}
