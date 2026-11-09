import "server-only";

import { headers } from "next/headers";

import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";
import type { HealthCheck } from "@/lib/admin/types";

const TIMEOUT_MS = 4500;

async function requestOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  try {
    const headerStore = await headers();
    const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
    const proto = headerStore.get("x-forwarded-proto") ?? "http";
    if (host) return `${proto}://${host}`;
  } catch {
    // headers() is unavailable outside a request scope.
  }
  return (configured || "http://localhost:3000").replace(/\/$/, "");
}

async function timed<T>(
  action: () => Promise<T>
): Promise<{ ok: boolean; value?: T; error?: string; latencyMs: number }> {
  const started = Date.now();
  try {
    const value = await action();
    return { ok: true, value, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Request failed",
      latencyMs: Date.now() - started,
    };
  }
}

function now() {
  return new Date().toISOString();
}

function healthCheck(
  id: string,
  label: string,
  status: HealthCheck["status"],
  detail: string,
  latencyMs: number | null = null
): HealthCheck {
  return { id, label, status, detail, latencyMs, checkedAt: now() };
}

type AdminSupabase = Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>;

async function checkDatabase(supabase: AdminSupabase): Promise<HealthCheck> {
  const result = await timed(async () => {
    const { error } = await supabase.rpc("admin_ping");
    if (error) throw new Error(error.message);
  });

  if (!result.ok) {
    return healthCheck(
      "database",
      "Supabase database",
      "unavailable",
      "The privileged health query failed.",
      result.latencyMs
    );
  }

  return healthCheck(
    "database",
    "Supabase database",
    "operational",
    "Postgres accepted a privileged query.",
    result.latencyMs
  );
}

async function checkHttpService(
  id: string,
  label: string,
  url: string,
  detailOnSuccess: string
): Promise<HealthCheck> {
  const result = await timed(async () => {
    const response = await fetch(url, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  });

  if (!result.ok) {
    return healthCheck(id, label, "unavailable", "The service health endpoint did not respond.", result.latencyMs);
  }

  return healthCheck(id, label, "operational", detailOnSuccess, result.latencyMs);
}

async function checkWebsiteAndApi(): Promise<HealthCheck[]> {
  if (!isSupabaseConfigured()) {
    return [
      healthCheck("website", "Main website", "unknown", "Supabase environment is not configured."),
      healthCheck("api", "Backend API", "unknown", "Supabase environment is not configured."),
    ];
  }

  const origin = await requestOrigin();
  const result = await timed(async () => {
    const response = await fetch(`${origin}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as { status?: string };
  });

  if (!result.ok) {
    return [
      healthCheck("website", "Main website", "operational", "This admin page rendered from the live application.", null),
      healthCheck("api", "Backend API", "unavailable", "The application health endpoint did not respond.", result.latencyMs),
    ];
  }

  const degraded = result.value?.status !== "ok";
  return [
    healthCheck("website", "Main website", "operational", "This admin page rendered from the live application.", null),
    healthCheck(
      "api",
      "Backend API",
      degraded ? "degraded" : "operational",
      degraded ? "The health endpoint reports a degraded dependency." : "The application health endpoint responded normally.",
      result.latencyMs
    ),
  ];
}

async function checkAi(): Promise<HealthCheck> {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim() || "not selected";

  if (!baseUrl || !apiKey) {
    return healthCheck(
      "ai",
      "AI provider",
      "not_configured",
      "AI_BASE_URL or AI_API_KEY is not configured."
    );
  }

  const result = await timed(async () => {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    return response;
  });

  if (!result.ok || !result.value) {
    return healthCheck(
      "ai",
      "AI provider",
      "unavailable",
      "The provider API could not be reached.",
      result.latencyMs
    );
  }

  if (result.value.status === 401 || result.value.status === 403) {
    return healthCheck(
      "ai",
      "AI provider",
      "unavailable",
      `The provider rejected the configured credentials (HTTP ${result.value.status}).`,
      result.latencyMs
    );
  }

  if (!result.value.ok) {
    return healthCheck(
      "ai",
      "AI provider",
      "degraded",
      `The provider returned HTTP ${result.value.status}.`,
      result.latencyMs
    );
  }

  return healthCheck(
    "ai",
    "AI provider",
    "operational",
    `Live model listing succeeded. Configured model: ${model}.`,
    result.latencyMs
  );
}

async function checkOcr(): Promise<HealthCheck> {
  const result = await timed(async () => {
    const response = await fetch(
      "https://cdn.jsdelivr.net/npm/tesseract.js@6/dist/worker.min.js",
      {
        method: "HEAD",
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
  });

  if (!result.ok) {
    return healthCheck(
      "ocr",
      "OCR engine",
      "degraded",
      "The browser OCR asset CDN is not reachable; text-based PDFs and DOCX files are unaffected.",
      result.latencyMs
    );
  }

  return healthCheck(
    "ocr",
    "OCR engine",
    "operational",
    "Browser OCR assets are reachable for scanned documents and images.",
    result.latencyMs
  );
}

async function checkDocumentProcessing(supabase: AdminSupabase): Promise<HealthCheck> {
  const result = await timed(async () => {
    const { data, error } = await supabase.rpc("admin_document_pipeline");
    if (error) throw new Error(error.message);
    return data as {
      total: number;
      failed: number;
      processing: number;
      needsReview: number;
    };
  });

  if (!result.ok || !result.value) {
    return healthCheck(
      "documents",
      "Document processing",
      "unavailable",
      "Pipeline metrics could not be read.",
      result.latencyMs
    );
  }

  if (result.value.failed > 0) {
    return healthCheck(
      "documents",
      "Document processing",
      "degraded",
      `${result.value.failed} document${result.value.failed === 1 ? "" : "s"} recorded a processing failure.`,
      result.latencyMs
    );
  }

  return healthCheck(
    "documents",
    "Document processing",
    "operational",
    `${result.value.total} document${result.value.total === 1 ? "" : "s"} on record; ${result.value.processing} processing, ${result.value.needsReview} awaiting review.`,
    result.latencyMs
  );
}

export async function runHealthChecks(supabase: AdminSupabase): Promise<HealthCheck[]> {
  if (!isSupabaseConfigured()) {
    return [
      healthCheck("database", "Supabase database", "not_configured", "Supabase environment is not configured."),
      healthCheck("auth", "Authentication", "not_configured", "Supabase environment is not configured."),
      healthCheck("storage", "Private storage", "not_configured", "Supabase environment is not configured."),
      healthCheck("ai", "AI provider", "not_configured", "AI environment is not configured."),
      healthCheck("website", "Main website", "operational", "This page rendered, but dependencies are unconfigured."),
      healthCheck("api", "Backend API", "not_configured", "Supabase environment is not configured."),
      healthCheck("documents", "Document processing", "not_configured", "Supabase environment is not configured."),
      healthCheck("ocr", "OCR engine", "unknown", "Not checked."),
      healthCheck("background", "Background tasks", "not_configured", "No background workers are configured."),
    ];
  }

  const [websiteAndApi, database, auth, storage, ai, documents, ocr] = await Promise.all([
    checkWebsiteAndApi(),
    checkDatabase(supabase),
    checkHttpService(
      "auth",
      "Authentication",
      `${SUPABASE_URL}/auth/v1/health`,
      "Supabase Auth is responding."
    ),
    checkHttpService(
      "storage",
      "Private storage",
      `${SUPABASE_URL}/storage/v1/health`,
      "Supabase Storage is responding."
    ),
    checkAi(),
    checkDocumentProcessing(supabase),
    checkOcr(),
  ]);

  return [
    websiteAndApi[0],
    websiteAndApi[1],
    database,
    auth,
    storage,
    documents,
    ocr,
    ai,
    healthCheck(
      "background",
      "Background tasks",
      "not_configured",
      "HINTERLAND runs extraction and AI work in request scope; no background workers are configured."
    ),
  ];
}
