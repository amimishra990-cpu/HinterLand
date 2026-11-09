import { NextResponse } from "next/server";

import { badRequest, getApiContext, notFound, serverError } from "@/lib/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { id } = await params;
  if (!UUID.test(id)) return notFound("Document not found.");

  const pageRaw = new URL(request.url).searchParams.get("page") ?? "1";
  const pageNumber = Number(pageRaw);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return badRequest("The page number is invalid.");
  }

  const { data: document, error: documentError } = await context.supabase
    .from("documents")
    .select(
      "id, name, file_type, page_count, status, extraction_method, extraction_confidence, extraction_quality, mime_type, processing_error, processed_at"
    )
    .eq("id", id)
    .eq("user_id", context.user.id)
    .maybeSingle();

  if (documentError) {
    console.error("Document page lookup failed", documentError.message);
    return serverError("The document could not be loaded.");
  }
  if (!document) return notFound("Document not found.");

  const { data: page, error: pageError } = await context.supabase
    .from("document_pages")
    .select(
      "page_number, text, extraction_method, confidence, uncertain, uncertain_lines, rotation_applied, duplicate_of"
    )
    .eq("document_id", id)
    .eq("user_id", context.user.id)
    .eq("page_number", pageNumber)
    .maybeSingle();

  if (pageError) {
    console.error("Page index lookup failed", pageError.message);
    return serverError("The page could not be loaded.");
  }

  return NextResponse.json({
    document: {
      id: document.id,
      name: document.name,
      fileType: document.file_type,
      pageCount: document.page_count,
      status: document.status,
      extractionMethod: document.extraction_method,
      extractionConfidence: document.extraction_confidence,
      extractionQuality: document.extraction_quality,
      mimeType: document.mime_type,
      processingError: document.processing_error,
      processedAt: document.processed_at,
    },
    page: page
      ? {
          pageNumber: page.page_number,
          text: page.text,
          extractionMethod: page.extraction_method,
          confidence:
            page.confidence === null ? null : Math.min(1, Math.max(0, Number(page.confidence))),
          uncertain: Boolean(page.uncertain),
          uncertainLines: Array.isArray(page.uncertain_lines) ? page.uncertain_lines : [],
          rotationApplied: page.rotation_applied,
          duplicateOf: page.duplicate_of,
        }
      : null,
  });
}
