import "server-only";

import type { AiConfig } from "@/lib/ai/config";
import { AiError } from "@/lib/ai/errors";

export type ProviderResult = {
  text: string;
  provider: string;
  model: string;
  usage: { inputTokens: number; outputTokens: number };
  finishReason: "complete" | "length" | "refusal";
};

type CallOptions = {
  system: string;
  user: string;
  maxOutputTokens: number;
  temperature: number;
  signal: AbortSignal;
};

type ProviderErrorBody = {
  error?: { code?: string; type?: string; message?: string };
};

async function failureFromResponse(response: Response): Promise<AiError> {
  let body: ProviderErrorBody | null = null;
  try {
    body = (await response.json()) as ProviderErrorBody;
  } catch {
    body = null;
  }
  const upstreamCode = body?.error?.code ?? body?.error?.type ?? "";
  const retryAfter = retryAfterMs(response, 0);

  if (response.status === 401 || response.status === 403) {
    return new AiError("ai_auth_failed");
  }
  if (response.status === 429) {
    return new AiError("ai_rate_limited", { retryable: true, retryAfterMs: retryAfter });
  }
  if (response.status === 400 || response.status === 422) {
    return new AiError("ai_bad_request", {
      retryable: false,
      message: upstreamCode || undefined,
    });
  }
  return new AiError("ai_provider_error", {
    retryable: response.status >= 500,
    message: upstreamCode || undefined,
    retryAfterMs: retryAfter,
  });
}

export function retryAfterMs(response: Response | null, attempt: number) {
  const header = response?.headers.get("retry-after") ?? "";
  const seconds = Number.parseFloat(header);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(8_000, Math.round(seconds * 1_000));
  }
  const date = Date.parse(header);
  if (Number.isFinite(date)) {
    return Math.min(8_000, Math.max(0, date - Date.now()));
  }
  return Math.min(4_000, 400 * 2 ** attempt);
}

async function readJson(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>;
  } catch {
    throw new AiError("ai_provider_error", { retryable: false });
  }
}

function openAiBody(config: AiConfig, options: CallOptions, jsonMode: boolean) {
  return {
    model: config.model,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    temperature: options.temperature,
    max_tokens: options.maxOutputTokens,
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  };
}

async function callOpenAiCompatible(
  config: AiConfig,
  options: CallOptions
): Promise<ProviderResult> {
  let jsonMode = config.jsonMode;
  let useCompletionTokens = false;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const body: Record<string, unknown> = { ...openAiBody(config, options, jsonMode) };
    if (useCompletionTokens) {
      delete body.max_tokens;
      body.max_completion_tokens = options.maxOutputTokens;
    }

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: options.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 400) {
        const raw = await response.text().catch(() => "");
        if (!useCompletionTokens && /max_tokens/i.test(raw)) {
          useCompletionTokens = true;
          continue;
        }
        if (jsonMode && /response_format|json_object|json mode/i.test(raw)) {
          jsonMode = false;
          continue;
        }
      }
      throw await failureFromResponse(response);
    }

    const payload = await readJson(response);
    const choice = Array.isArray(payload.choices)
      ? (payload.choices[0] as Record<string, unknown> | undefined)
      : undefined;
    const message = choice?.message as Record<string, unknown> | undefined;
    const content =
      typeof message?.content === "string"
        ? message.content
        : Array.isArray(message?.content)
          ? (message.content as Array<Record<string, unknown>>)
              .map((part) => (typeof part.text === "string" ? part.text : ""))
              .join("")
          : "";
    if (!content.trim()) {
      throw new AiError("ai_invalid_output", { retryable: false });
    }

    const rawFinish = typeof choice?.finish_reason === "string" ? choice.finish_reason : "stop";
    const finishReason =
      rawFinish === "length"
        ? ("length" as const)
        : rawFinish === "content_filter"
          ? ("refusal" as const)
          : ("complete" as const);
    const usage = (payload.usage ?? {}) as Record<string, unknown>;

    return {
      text: content,
      provider: config.provider === "openai" ? "openai" : "openai-compatible",
      model: typeof payload.model === "string" ? payload.model : config.model,
      usage: {
        inputTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : 0,
        outputTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : 0,
      },
      finishReason,
    };
  }

  throw new AiError("ai_bad_request", { retryable: false });
}

async function callAnthropic(
  config: AiConfig,
  options: CallOptions
): Promise<ProviderResult> {
  const response = await fetch(`${config.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.model,
      system: options.system,
      messages: [{ role: "user", content: options.user }],
      temperature: options.temperature,
      max_tokens: options.maxOutputTokens,
    }),
    signal: options.signal,
    cache: "no-store",
  });

  if (!response.ok) throw await failureFromResponse(response);

  const payload = await readJson(response);
  const blocks = Array.isArray(payload.content)
    ? (payload.content as Array<Record<string, unknown>>)
    : [];
  const text = blocks
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text as string)
    .join("");
  if (!text.trim()) throw new AiError("ai_invalid_output", { retryable: false });

  const stopReason = typeof payload.stop_reason === "string" ? payload.stop_reason : "end_turn";
  const usage = (payload.usage ?? {}) as Record<string, unknown>;

  return {
    text,
    provider: "anthropic",
    model: typeof payload.model === "string" ? payload.model : config.model,
    usage: {
      inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : 0,
      outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : 0,
    },
    finishReason:
      stopReason === "max_tokens" ? "length" : stopReason === "refusal" ? "refusal" : "complete",
  };
}

export async function callProvider(config: AiConfig, options: CallOptions): Promise<ProviderResult> {
  try {
    if (config.provider === "anthropic") {
      return await callAnthropic(config, options);
    }
    return await callOpenAiCompatible(config, options);
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiError("ai_timeout");
    }
    throw new AiError("ai_network", { retryable: true });
  }
}
