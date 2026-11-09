import "server-only";

import { NextResponse } from "next/server";
import type { ZodType } from "zod";

import { resolveAiConfig } from "@/lib/ai/config";
import { ContextAccessError } from "@/lib/ai/context";
import { normalizeAiError, publicAiMessage } from "@/lib/ai/errors";

const NO_STORE = { "cache-control": "no-store" } as const;

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
