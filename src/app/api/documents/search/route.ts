import { NextResponse } from "next/server";

import { badRequest, getApiContext, serverError } from "@/lib/api";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RESULTS = 20;

type PageRow = {
  document_id: string;
  page_number: number;
  text: string;
  confidence: number | string | null;
  uncertain: boolean;
  extraction_method: string;
};

type DocumentRow = {
  id: string;
  name: string;
  project_id: string | null;
  file_type: string;
  status: string;
  extraction_method: string | null;
  extracted_text: string | null;
};

type DocumentSummary = {
  id: string;
  name: string;
  project_id: string | null;
  file_type: string;
  status: string;
};

function makeSnippet(text: string, query: string, radius = 140) {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((term) => term.length > 1);
  const lower = text.toLowerCase();
  let index = -1;
  for (const term of terms) {
    const found = lower.indexOf(term);
    if (found >= 0 && (index < 0 || found < index)) index = found;
  }
  if (index < 0) index = 0;
  const start = Math.max(0, index - radius);
  const end = Math.min(text.length, index + radius * 2);
  return `${start > 0 ? "…" : ""}${text
    .slice(start, end)
    .replace(/\s+/g, " ")
    .trim()}${end < text.length ? "…" : ""}`;
}

export async function GET(request: Request) {
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const params = new URL(request.url).searchParams;
  const query = (params.get("q") ?? "").trim();
  if (query.length < 2) return badRequest("Enter at least two characters to search.");
  if (query.length > 200) return badRequest("The search query is too long.");

  const projectId = (params.get("projectId") ?? "").trim();
  if (projectId && !UUID.test(projectId)) return badRequest("The project filter is invalid.");

  const [{ data: pageRows, error: pageError }, { data: documentRows, error: documentError }] =
    await Promise.all([
      context.supabase
        .from("document_pages")
        .select("document_id, page_number, text, confidence, uncertain, extraction_method")
        .eq("user_id", context.user.id)
        .textSearch("search", query, { type: "websearch", config: "english" })
        .limit(MAX_RESULTS),
      context.supabase
        .from("documents")
        .select("id, name, project_id, file_type, status, extraction_method, extracted_text")
        .eq("user_id", context.user.id)
        .textSearch("search", query, { type: "websearch", config: "english" })
        .limit(MAX_RESULTS),
    ]);

  if (pageError || documentError) {
    console.error("Document search failed", pageError?.message ?? documentError?.message);
    return serverError("Document text could not be searched right now.");
  }

  const pages = (pageRows ?? []) as PageRow[];
  const documents = (documentRows ?? []) as DocumentRow[];

  const ids = Array.from(
    new Set([...pages.map((page) => page.document_id), ...documents.map((doc) => doc.id)])
  );
  let summaries: DocumentSummary[] = [];
  if (ids.length > 0) {
    const { data, error } = await context.supabase
      .from("documents")
      .select("id, name, project_id, file_type, status")
      .eq("user_id", context.user.id)
      .in("id", ids);
    if (error) {
      console.error("Document search names failed", error.message);
      return serverError("Document text could not be searched right now.");
    }
    summaries = (data ?? []) as DocumentSummary[];
  }

  const summaryById = new Map(summaries.map((summary) => [summary.id, summary]));
  const projectAllowed = (id: string | null) => !projectId || id === projectId;

  const results = [];

  for (const page of pages) {
    const summary = summaryById.get(page.document_id);
    if (!summary || !projectAllowed(summary.project_id)) continue;
    const confidence =
      page.confidence === null ? null : Math.min(1, Math.max(0, Number(page.confidence)));
    results.push({
      documentId: summary.id,
      documentName: summary.name,
      projectId: summary.project_id,
      fileType: summary.file_type,
      status: summary.status,
      pageNumber: page.page_number,
      snippet: makeSnippet(page.text, query),
      confidence,
      uncertain: page.uncertain,
      extractionMethod: page.extraction_method,
    });
  }

  const indexedDocuments = new Set(pages.map((page) => page.document_id));
  for (const document of documents) {
    if (indexedDocuments.has(document.id)) continue;
    if (!projectAllowed(document.project_id)) continue;
    const text = (document.extracted_text ?? "").trim();
    if (!text) continue;
    results.push({
      documentId: document.id,
      documentName: document.name,
      projectId: document.project_id,
      fileType: document.file_type,
      status: document.status,
      pageNumber: null,
      snippet: makeSnippet(text, query),
      confidence: null,
      uncertain: false,
      extractionMethod: document.extraction_method,
    });
  }

  const limited = results.slice(0, MAX_RESULTS);
  return NextResponse.json({
    query,
    results: limited,
    truncated: results.length > limited.length || pages.length >= MAX_RESULTS,
  });
}
