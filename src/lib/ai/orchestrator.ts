import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z, type ZodType } from "zod";

import { resolveAiConfig, type AiConfig } from "@/lib/ai/config";
import { AiError, normalizeAiError } from "@/lib/ai/errors";
import { parseJsonObject } from "@/lib/ai/json";
import { callProvider, type ProviderResult } from "@/lib/ai/provider";
import { assertWithinQuota } from "@/lib/ai/rate-limit";
import { PROMPT_VERSION } from "@/lib/ai/prompts";

export type AiFeature =
  | "communication"
  | "preparation"
  | "intelligence"
  | "document"
  | "development"
  | "knowledge";

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

export type StructuredRun<T> = { data: T; meta: AiMeta };

type RunInput<T> = {
  supabase: SupabaseClient;
  userId: string;
  feature: AiFeature;
  task: string;
  projectId?: string | null;
  inputRefs?: Record<string, unknown>;
  system: string;
  user: string;
  schema: ZodType<T>;
  maxOutputTokens?: number;
  temperature?: number;
};

type CacheEntry = { expiresAt: number; run: StructuredRun<unknown> };

const cache = new Map<string, CacheEntry>();

function cacheTtlMs() {
  const raw = Number.parseInt(process.env.AI_CACHE_TTL_MS ?? "", 10);
  return Number.isFinite(raw) ? Math.min(3_600_000, Math.max(0, raw)) : 300_000;
}

function cacheKey(config: AiConfig, input: { feature: string; system: string; user: string }) {
  return createHash("sha256")
    .update(`${input.feature}|${PROMPT_VERSION}|${config.provider}|${config.model}|${input.system}|${input.user}`)
    .digest("hex");
}

function readCache<T>(key: string): StructuredRun<T> | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.run as StructuredRun<T>;
}

function writeCache(key: string, run: StructuredRun<unknown>) {
  const ttl = cacheTtlMs();
  if (ttl <= 0) return;
  if (cache.size >= 100) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, { expiresAt: Date.now() + ttl, run });
}

async function callWithTimeout(
  config: AiConfig,
  parts: { system: string; user: string },
  maxOutputTokens: number,
  temperature: number
): Promise<ProviderResult> {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.timeoutMs);
  try {
    return await callProvider(config, {
      system: parts.system,
      user: parts.user,
      maxOutputTokens,
      temperature,
      signal: controller.signal,
    });
  } catch (error) {
    if (timedOut) throw new AiError("ai_timeout");
    throw normalizeAiError(error);
  } finally {
    clearTimeout(timer);
  }
}

async function callWithRetry(
  config: AiConfig,
  parts: { system: string; user: string },
  maxOutputTokens: number,
  temperature: number
) {
  let lastError: AiError | null = null;
  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      return await callWithTimeout(config, parts, maxOutputTokens, temperature);
    } catch (error) {
      const normalized = normalizeAiError(error);
      lastError = normalized;
      if (!normalized.retryable || attempt >= config.maxRetries) break;
      const delay =
        normalized.retryAfterMs ?? Math.min(4_000, 400 * 2 ** attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError ?? new AiError("ai_provider_error");
}

function schemaIssues(error: z.ZodError) {
  return error.issues
    .slice(0, 8)
    .map((issue) => `${issue.path.join(".") || "root"}: ${issue.message}`)
    .join("; ");
}

async function recordRun(input: {
  supabase: SupabaseClient;
  userId: string;
  feature: AiFeature;
  task: string;
  projectId?: string | null;
  inputRefs?: Record<string, unknown>;
  config: AiConfig;
  status: "succeeded" | "failed" | "refused" | "invalid_output";
  errorCode?: string | null;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
  requestHash: string;
}): Promise<string | null> {
  try {
    const { data, error } = await input.supabase
      .from("ai_runs")
      .insert({
        user_id: input.userId,
        project_id: input.projectId ?? null,
        feature: input.feature,
        task: input.task.slice(0, 80),
        provider: input.config.provider,
        model: input.config.model.slice(0, 120),
        prompt_version: PROMPT_VERSION,
        input_refs: input.inputRefs ?? {},
        request_hash: input.requestHash,
        status: input.status,
        error_code: input.errorCode ?? null,
        input_tokens: input.inputTokens,
        output_tokens: input.outputTokens,
        latency_ms: input.latencyMs,
      })
      .select("id")
      .single();
    if (error) {
      console.error("ai_runs insert failed", error.code);
      return null;
    }
    return typeof data?.id === "string" ? data.id : null;
  } catch {
    console.error("ai_runs insert failed", "unexpected");
    return null;
  }
}

export async function runStructured<T>(input: RunInput<T>): Promise<StructuredRun<T>> {
  const resolved = resolveAiConfig();
  if (!resolved.configured) {
    throw new AiError("ai_not_configured", { message: resolved.issues.join(" ") });
  }
  const config = resolved.config;

  await assertWithinQuota(input.supabase, input.userId, config);

  const key = cacheKey(config, {
    feature: input.feature,
    system: input.system,
    user: input.user,
  });
  const cached = readCache<T>(key);
  if (cached) {
    return { data: cached.data, meta: { ...cached.meta, cached: true } };
  }

  const maxOutputTokens = Math.min(
    16_000,
    Math.max(256, input.maxOutputTokens ?? config.maxOutputTokens)
  );
  const temperature = Math.min(1, Math.max(0, input.temperature ?? config.temperature));
  const started = Date.now();
  let inputTokens = 0;
  let outputTokens = 0;

  const fail = async (error: AiError, hash: string): Promise<never> => {
    await recordRun({
      supabase: input.supabase,
      userId: input.userId,
      feature: input.feature,
      task: input.task,
      projectId: input.projectId,
      inputRefs: input.inputRefs,
      config,
      status: error.code === "ai_refused" ? "refused" : "failed",
      errorCode: error.code,
      inputTokens,
      outputTokens,
      latencyMs: Date.now() - started,
      requestHash: hash,
    });
    throw error;
  };

  let result = await callWithRetry(
    config,
    { system: input.system, user: input.user },
    maxOutputTokens,
    temperature
  ).catch((error) => {
    const normalized = normalizeAiError(error);
    return fail(normalized, key);
  });

  inputTokens += result.usage.inputTokens;
  outputTokens += result.usage.outputTokens;

  if (result.finishReason === "refusal") {
    return fail(new AiError("ai_refused"), key);
  }
  if (result.finishReason === "length") {
    return fail(new AiError("ai_truncated"), key);
  }

  let parsedValue: unknown;
  let validated = input.schema.safeParse(undefined);
  try {
    parsedValue = parseJsonObject(result.text);
    validated = input.schema.safeParse(parsedValue);
  } catch {
    validated = input.schema.safeParse(undefined);
  }

  if (!validated.success) {
    let repairSchema = "";
    try {
      repairSchema = JSON.stringify(z.toJSONSchema(input.schema));
    } catch {
      repairSchema = "(schema description unavailable)";
    }
    const repairUser = `${input.user}

---
Your previous response was not accepted. Problems: ${schemaIssues(validated.error)}.
Return only a JSON object that satisfies this JSON Schema:
${repairSchema}`;

    result = await callWithRetry(
      config,
      { system: input.system, user: repairUser },
      maxOutputTokens,
      temperature
    ).catch((error) => {
      const normalized = normalizeAiError(error);
      return fail(normalized, key);
    });

    inputTokens += result.usage.inputTokens;
    outputTokens += result.usage.outputTokens;

    if (result.finishReason === "refusal") return fail(new AiError("ai_refused"), key);
    if (result.finishReason === "length") return fail(new AiError("ai_truncated"), key);

    try {
      validated = input.schema.safeParse(parseJsonObject(result.text));
    } catch {
      validated = input.schema.safeParse(undefined);
    }

    if (!validated.success) {
      return fail(new AiError("ai_invalid_output"), key);
    }
  }

  const runId = await recordRun({
    supabase: input.supabase,
    userId: input.userId,
    feature: input.feature,
    task: input.task,
    projectId: input.projectId,
    inputRefs: input.inputRefs,
    config,
    status: "succeeded",
    inputTokens,
    outputTokens,
    latencyMs: Date.now() - started,
    requestHash: key,
  });

  const run: StructuredRun<T> = {
    data: validated.data,
    meta: {
      provider: result.provider,
      model: result.model,
      promptVersion: PROMPT_VERSION,
      usage: { inputTokens, outputTokens },
      latencyMs: Date.now() - started,
      finishReason: "complete",
      runId,
      cached: false,
    },
  };
  writeCache(key, run as StructuredRun<unknown>);
  return run;
}
