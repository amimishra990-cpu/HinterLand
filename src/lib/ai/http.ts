import "server-only";

import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { reportIssue } from "@/lib/admin/telemetry";
import { resolveAiConfig } from "@/lib/ai/config";
import { ContextAccessError } from "@/lib/ai/context";
import { normalizeAiError, publicAiMessage } from "@/lib/ai/errors";

const NO_STORE = { "cache-control": "no-store" } as const;

const CRITICAL_AI_CODES = new Set(["ai_auth_failed"]);
const WARNING_AI_CODES = new Set([
  "ai_rate_limited",
  "ai_quota_exceeded",
  "ai_not_configured",
  "ai_refused",
  "ai_truncated",
]);

export function noStore<T>(body: T, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function aiFailure(error: unknown) {
  if (error instanceof ContextAccessError) {
    return NextResponse.json(
      { error: error.message, code: "context_not_authorized" },
      { status: 400, headers: NO_STORE }
    );
  }

  const normalized = normalizeAiError(error);
  console.error("AI route failure", normalized.code);
  void reportIssue({
    category: "ai",
    severity: CRITICAL_AI_CODES.has(normalized.code)
      ? "critical"
      : WARNING_AI_CODES.has(normalized.code)
        ? "warning"
        : "error",
    message: `AI request failed: ${normalized.code}`,
    metadata: { code: normalized.code, status: normalized.status },
  });

  let detail: string | undefined;
  if (normalized.code === "ai_not_configured") {
    const resolved = resolveAiConfig();
    if (!resolved.configured) detail = resolved.issues.join(" ");
  }

  return NextResponse.json(
    {
      error: publicAiMessage(normalized.code),
      code: normalized.code,
      ...(detail ? { detail } : {}),
    },
    { status: normalized.status, headers: NO_STORE }
  );
}

export function parseBody<T>(
  schema: ZodType<T>,
  body: unknown
): { ok: true; data: T } | { ok: false; message: string } {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path.join(".") || "request";
    return {
      ok: false,
      message: `Invalid request: ${path} ${issue?.message ?? "is not valid"}.`,
    };
  }
  return { ok: true, data: parsed.data };
}
