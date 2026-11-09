import "server-only";

export type AiProviderKind = "openai" | "openai-compatible" | "anthropic";

export type AiConfig = {
  provider: AiProviderKind;
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxRetries: number;
  maxOutputTokens: number;
  temperature: number;
  requestsPerHour: number;
  jsonMode: boolean;
};

const PROVIDERS = new Set<AiProviderKind>(["openai", "openai-compatible", "anthropic"]);

function readInt(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function readFloat(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseFloat(value ?? "");
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function detectProvider(): AiProviderKind {
  const explicit = (process.env.AI_PROVIDER ?? "").trim().toLowerCase();
  if (PROVIDERS.has(explicit as AiProviderKind)) return explicit as AiProviderKind;
  if (process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
    return "anthropic";
  }
  return "openai";
}

export type AiConfigResult =
  | { configured: true; config: AiConfig }
  | { configured: false; provider: AiProviderKind; model: string; issues: string[] };

export function resolveAiConfig(): AiConfigResult {
  const provider = detectProvider();
  const apiKey =
    (process.env.AI_API_KEY ?? "").trim() ||
    (provider === "anthropic"
      ? (process.env.ANTHROPIC_API_KEY ?? "").trim()
      : (process.env.OPENAI_API_KEY ?? "").trim());
  const defaultBase =
    provider === "anthropic" ? "https://api.anthropic.com" : "https://api.openai.com/v1";
  const baseUrl = ((process.env.AI_BASE_URL ?? "").trim() || defaultBase).replace(/\/+$/, "");
  const model = (process.env.AI_MODEL ?? "").trim();

  const issues: string[] = [];
  if (!apiKey) {
    issues.push(
      provider === "anthropic"
        ? "Set AI_API_KEY (or ANTHROPIC_API_KEY) to an Anthropic API key."
        : "Set AI_API_KEY (or OPENAI_API_KEY) to a provider API key."
    );
  }
  if (!model) {
    issues.push("Set AI_MODEL to an approved model name for the configured provider.");
  }
  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" && parsed.hostname !== "localhost" && parsed.hostname !== "127.0.0.1") {
      issues.push("AI_BASE_URL must use HTTPS (plain HTTP is allowed only for localhost testing).");
    }
  } catch {
    issues.push("AI_BASE_URL is not a valid URL.");
  }

  if (issues.length > 0) {
    return { configured: false, provider, model, issues };
  }

  return {
    configured: true,
    config: {
      provider,
      apiKey,
      baseUrl,
      model,
      timeoutMs: readInt(process.env.AI_TIMEOUT_MS, 60_000, 5_000, 180_000),
      maxRetries: readInt(process.env.AI_MAX_RETRIES, 2, 0, 4),
      maxOutputTokens: readInt(process.env.AI_MAX_OUTPUT_TOKENS, 3_000, 256, 16_000),
      temperature: readFloat(process.env.AI_TEMPERATURE, 0.2, 0, 1),
      requestsPerHour: readInt(process.env.AI_REQUESTS_PER_HOUR, 40, 1, 10_000),
      jsonMode:
        (process.env.AI_JSON_MODE ?? "").trim() === "true" ||
        ((process.env.AI_JSON_MODE ?? "").trim() === "" && provider === "openai"),
    },
  };
}

export function aiStatus() {
  const result = resolveAiConfig();
  if (result.configured) {
    return {
      configured: true as const,
      provider: result.config.provider,
      model: result.config.model,
    };
  }
  return {
    configured: false as const,
    provider: result.provider,
    model: result.model,
    issues: result.issues,
  };
}
