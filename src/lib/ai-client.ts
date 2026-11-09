"use client";

export type AiMeta = {
  provider: string;
  model: string;
  promptVersion: string;
  usage: { inputTokens: number; outputTokens: number };
  latencyMs: number;
  finishReason: "complete";
  runId: string | null;
  cached: boolean;
};

export type AiContextSource = {
  id: string;
  kind: "project" | "document" | "knowledge" | "meeting" | "action";
  label: string;
  chars: number;
  truncated: boolean;
};

export type AiContextSummary = {
  sources: AiContextSource[];
  omitted: string[];
  truncated: boolean;
  estimatedTokens: number;
};

export type AiStatus =
  | { configured: true; provider: string; model: string }
  | { configured: false; provider: string; model: string; issues: string[] };

export class AiRequestError extends Error {
  readonly code: string;
  readonly detail?: string;

  constructor(message: string, code = "ai_request_failed", detail?: string) {
    super(message);
    this.name = "AiRequestError";
    this.code = code;
    this.detail = detail;
  }
}

async function readPayload(response: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function postAi<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const payload = await readPayload(response);
  if (!response.ok) {
    const message =
      typeof payload?.error === "string"
        ? payload.error
        : "The AI request could not be completed.";
    throw new AiRequestError(
      message,
      typeof payload?.code === "string" ? payload.code : "ai_request_failed",
      typeof payload?.detail === "string" ? payload.detail : undefined
    );
  }
  return payload as T;
}

export async function getAiStatus(): Promise<AiStatus> {
  const response = await fetch("/api/ai/status", { cache: "no-store" });
  const payload = await readPayload(response);
  if (!response.ok || !payload) {
    throw new AiRequestError("AI status could not be loaded.");
  }
  return payload as AiStatus;
}
