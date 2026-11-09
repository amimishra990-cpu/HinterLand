import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { SUPABASE_STORAGE_BUCKET } from "@/lib/supabase/config";
import { isSourceKind } from "@/lib/workspace-types";
import {
  MAX_UPLOAD_BYTES,
  documentKind,
  matchesSignature,
} from "@/lib/document-processing/file-kind";

const MAX_UPLOADS_PER_HOUR = 40;
const MAX_TEXT = 50000;
const MAX_PAGE_TEXT = 30000;
const MAX_PAGES = 1000;
const PAGE_METHODS = new Set(["pdf-text", "ocr", "docx", "image"]);
const EXTRACTION_METHODS = new Set(["pdf-text", "ocr", "mixed", "docx", "image", "manual"]);

type PageInput = {
  pageNumber: number;
  text: string;
  extractionMethod: "pdf-text" | "ocr" | "docx" | "image";
  confidence: number | null;
  uncertain: boolean;
  uncertainLines: string[];
  rotationApplied: number | null;
  duplicateOf: number | null;
};

function numberInRange(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return value;
}

function parsePages(raw: string): PageInput[] | string {
  if (!raw.trim()) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return "The page index could not be read.";
  }
  if (!Array.isArray(parsed)) return "The page index is invalid.";
  if (parsed.length > MAX_PAGES) return `Documents are limited to ${MAX_PAGES} indexed pages.`;

  const pages: PageInput[] = [];
  const seen = new Set<number>();

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") return "A page entry is invalid.";
    const page = entry as Record<string, unknown>;
    const pageNumber = numberInRange(page.pageNumber, 1, 100000);
    if (!pageNumber || !Number.isInteger(pageNumber)) return "A page number is invalid.";
    if (seen.has(pageNumber)) return "The page index contains duplicate page numbers.";
    seen.add(pageNumber);

    const text = typeof page.text === "string" ? page.text.slice(0, MAX_PAGE_TEXT) : "";
    const method = String(page.extractionMethod ?? "pdf-text");
    if (!PAGE_METHODS.has(method)) return "A page extraction method is invalid.";

    const confidence =
      page.confidence === null || page.confidence === undefined
        ? null
        : numberInRange(page.confidence, 0, 1);
    if (page.confidence !== null && page.confidence !== undefined && confidence === null) {
      return "A page confidence value is invalid.";
    }

    const uncertainLines = Array.isArray(page.uncertainLines)
      ? page.uncertainLines
          .filter((line): line is string => typeof line === "string")
          .slice(0, 25)
          .map((line) => line.slice(0, 200))
      : [];

    const rotation = page.rotationApplied;
    const rotationApplied =
      rotation === null || rotation === undefined
        ? null
        : [0, 90, 180, 270].includes(Number(rotation))
          ? Number(rotation)
          : null;

    const duplicateOf =
      page.duplicateOf === null || page.duplicateOf === undefined
        ? null
        : numberInRange(Number(page.duplicateOf), 1, 100000);

    pages.push({
      pageNumber,
      text,
      extractionMethod: method as PageInput["extractionMethod"],
      confidence,
      uncertain: Boolean(page.uncertain),
      uncertainLines,
      rotationApplied,
      duplicateOf: duplicateOf ? Math.floor(duplicateOf) : null,
    });
  }

  return pages.sort((a, b) => a.pageNumber - b.pageNumber);
}

function parseQuality(raw: string) {
  const empty = {
    pageCount: 0,
    textPages: 0,
    scannedPages: 0,
    ocrPages: 0,
    lowConfidencePages: 0,
    uncertainPages: 0,
    duplicatePages: 0,
    emptyPages: 0,
    repeatedLinesRemoved: 0,
    truncated: false,
    warnings: [] as string[],
  };
  if (!raw.trim()) return empty;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return empty;
  }
  if (!parsed || typeof parsed !== "object") return empty;
  const value = parsed as Record<string, unknown>;
  const count = (key: string) => {
    const number = Number(value[key]);
    return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
  };
  const warnings = Array.isArray(value.warnings)
    ? value.warnings
        .filter((warning): warning is string => typeof warning === "string")
        .slice(0, 30)
        .map((warning) => warning.slice(0, 300))
    : [];

  return {
    pageCount: count("pageCount"),
    textPages: count("textPages"),
    scannedPages: count("scannedPages"),
    ocrPages: count("ocrPages"),
    lowConfidencePages: count("lowConfidencePages"),
    uncertainPages: count("uncertainPages"),
    duplicatePages: count("duplicatePages"),
    emptyPages: count("emptyPages"),
    repeatedLinesRemoved: count("repeatedLinesRemoved"),
    truncated: Boolean(value.truncated),
    warnings,
  };
}

const METHOD_LABEL: Record<string, string> = {
  "pdf-text": "selectable PDF text",
  ocr: "OCR",
  mixed: "OCR and selectable PDF text",
  docx: "the DOCX text layer",
  image: "OCR on an image",
  manual: "manual text",
};

function safeFileName(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^\w.\- ]+/g, "_")
    .replace(/\s+/g, "-")
    .slice(-120) || "document";
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const { count: recentUploads } = await context.supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", context.user.id)
    .gte("uploaded_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if ((recentUploads ?? 0) >= MAX_UPLOADS_PER_HOUR) {
    return NextResponse.json(
      { error: "Too many uploads in the last hour. Try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return badRequest("A multipart form body is required.");
  }

  const file = formData.get("file");
  if (!(file instanceof File)) return badRequest("Choose a PDF, DOCX, or image file.");
  if (file.size === 0) return badRequest("The selected file is empty.");
  if (file.size > MAX_UPLOAD_BYTES) return badRequest("Files must be 20 MB or smaller.");

  const kind = documentKind(file);
  if (!kind) return badRequest("Only PDF, DOCX, PNG, JPEG, and WebP files are accepted.");

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  if (!matchesSignature(header, kind)) {
    return badRequest(
      "The file contents do not match the file type. Choose a valid PDF, DOCX, PNG, JPEG, or WebP file."
    );
  }

  const rawName = String(formData.get("name") ?? "").trim();
  if (!rawName) return badRequest("Add a document name.");
  if (rawName.length > 240) return badRequest("The document name is too long.");
  const hasExtension = new RegExp(`\\.(${kind.extensions.join("|")})$`, "i").test(rawName);
  const finalName = hasExtension ? rawName : `${rawName}.${kind.extension}`;

  const sourceKindRaw = String(formData.get("sourceKind") ?? "Document").trim();
  const sourceKind = isSourceKind(sourceKindRaw) ? sourceKindRaw : "Document";

  const projectIdRaw = String(formData.get("projectId") ?? "").trim();
  let projectId: string | null = null;
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
    projectId = project.id;
  }

  const extractedTextRaw = String(formData.get("extractedText") ?? "");
  const extractedText = extractedTextRaw.slice(0, MAX_TEXT);

  const pageCountRaw = Number(formData.get("pageCount"));
  const pageCount =
    Number.isFinite(pageCountRaw) && pageCountRaw >= 0 ? Math.floor(pageCountRaw) : null;

  const extractionMethodRaw = String(formData.get("extractionMethod") ?? "");
  const extractionMethod = EXTRACTION_METHODS.has(extractionMethodRaw)
    ? extractionMethodRaw
    : null;

  const confidenceRaw = formData.get("extractionConfidence");
  const extractionConfidence =
    confidenceRaw === null || String(confidenceRaw).trim() === ""
      ? null
      : numberInRange(Number(confidenceRaw), 0, 1);

  const contentHashRaw = String(formData.get("contentHash") ?? "").trim().toLowerCase();
  const contentHash = /^[0-9a-f]{64}$/.test(contentHashRaw) ? contentHashRaw : null;

  const pagesResult = parsePages(String(formData.get("pages") ?? ""));
  if (typeof pagesResult === "string") return badRequest(pagesResult);
  const pages = pagesResult;
  const quality = parseQuality(String(formData.get("extractionQuality") ?? ""));
  const processingError = String(formData.get("processingError") ?? "").trim().slice(0, 500);

  if (contentHash) {
    const { data: existing, error: lookupError } = await context.supabase
      .from("documents")
      .select("id, name")
      .eq("user_id", context.user.id)
      .eq("content_hash", contentHash)
      .maybeSingle();
    if (lookupError) {
      console.error("Duplicate lookup failed", lookupError.message);
    }
    if (existing) {
      return NextResponse.json(
        {
          error: `This file is already in your library as "${existing.name}". The existing copy was not processed again.`,
          existingDocumentId: existing.id,
        },
        { status: 409 }
      );
    }
  }

  const uncertainOcr =
    pages.some((page) => page.uncertain) ||
    (extractionConfidence !== null && extractionConfidence < 0.75);
  const status = uncertainOcr ? "Needs review" : "Ready";

  const documentId = crypto.randomUUID();
  const storagePath = `${context.user.id}/${documentId}/${safeFileName(finalName)}`;

  const { error: uploadError } = await context.supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(storagePath, file, {
      contentType: kind.mimeType,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    console.error("Document upload failed", uploadError.message);
    return serverError(
      "The file could not be uploaded to private storage. Confirm the documents bucket and storage policies exist."
    );
  }

  const methodLabel = extractionMethod
    ? METHOD_LABEL[extractionMethod] ?? extractionMethod
    : "text extraction";

  const { error: insertError } = await context.supabase.from("documents").insert({
    id: documentId,
    user_id: context.user.id,
    project_id: projectId,
    name: finalName,
    file_type: kind.fileType,
    source_kind: sourceKind,
    status,
    storage_path: storagePath,
    size_bytes: file.size,
    page_count: pageCount,
    excerpt: extractedText.slice(0, 2400),
    extracted_text: extractedText || null,
    extraction_method: extractionMethod,
    extraction_confidence: extractionConfidence,
    extraction_quality: quality,
    content_hash: contentHash,
    mime_type: kind.mimeType,
    processed_at: new Date().toISOString(),
    processing_error: processingError || null,
    analysis: {
      summary: `Text was extracted from ${methodLabel}.${
        quality.truncated ? " Extraction stopped at the 50,000-character limit." : ""
      }${
        uncertainOcr
          ? " Some pages were recognized with low confidence and are marked for review."
          : ""
      } No automated analysis has been run yet.`,
      findings: [
        pageCount
          ? `${pageCount} page${pageCount === 1 ? "" : "s"} processed.`
          : "Document text processed.",
        quality.scannedPages > 0
          ? `${quality.scannedPages} scanned page${
              quality.scannedPages === 1 ? "" : "s"
            } went through OCR.`
          : "All text came from the document's own text layer.",
        quality.duplicatePages > 0
          ? `${quality.duplicatePages} duplicate page${
              quality.duplicatePages === 1 ? "" : "s"
            } detected.`
          : "",
      ].filter(Boolean),
      gaps: [
        uncertainOcr ? "Review the low-confidence OCR lines before relying on this text." : "",
        ...quality.warnings,
        "Run the document summary or analysis to generate reviewed findings.",
      ].filter(Boolean),
    },
  });

  if (insertError) {
    console.error("Document metadata insert failed", insertError.message);
    await context.supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([storagePath]);
    if (`${insertError.code}` === "23505") {
      return NextResponse.json(
        {
          error:
            "This file is already in your library. The existing copy was not processed again.",
        },
        { status: 409 }
      );
    }
    return serverError("The document record could not be saved.");
  }

  if (pages.length > 0) {
    const rows = pages.map((page) => ({
      user_id: context.user.id,
      document_id: documentId,
      page_number: page.pageNumber,
      text: page.text,
      extraction_method: page.extractionMethod,
      confidence: page.confidence,
      uncertain: page.uncertain,
      uncertain_lines: page.uncertainLines,
      rotation_applied: page.rotationApplied,
      duplicate_of: page.duplicateOf,
    }));

    for (let index = 0; index < rows.length; index += 200) {
      const { error: pageError } = await context.supabase
        .from("document_pages")
        .insert(rows.slice(index, index + 200));
      if (pageError) {
        console.error("Document page index insert failed", pageError.message);
        await context.supabase.from("documents").delete().eq("id", documentId);
        await context.supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([storagePath]);
        return serverError("The page index could not be saved, so the upload was rolled back.");
      }
    }
  }

  return NextResponse.json({ id: documentId, status, duplicate: false }, { status: 201 });
}
