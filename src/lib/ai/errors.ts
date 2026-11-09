import "server-only";

export type AiErrorCode =
  | "ai_not_configured"
  | "ai_timeout"
  | "ai_network"
  | "ai_rate_limited"
  | "ai_quota_exceeded"
  | "ai_auth_failed"
  | "ai_bad_request"
  | "ai_provider_error"
  | "ai_refused"
  | "ai_truncated"
  | "ai_invalid_output";

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;
  readonly retryable: boolean;
  readonly retryAfterMs: number | null;

  constructor(
    code: AiErrorCode,
    options: {
      status?: number;
      retryable?: boolean;
      message?: string;
      retryAfterMs?: number | null;
    } = {}
  ) {
    super(options.message ?? code);
    this.name = "AiError";
    this.code = code;
    this.status = options.status ?? statusForCode(code);
    this.retryable =
      options.retryable ?? (code === "ai_rate_limited" || code === "ai_provider_error");
    this.retryAfterMs = options.retryAfterMs ?? null;
  }
}

export function statusForCode(code: AiErrorCode) {
  switch (code) {
    case "ai_not_configured":
      return 503;
    case "ai_timeout":
      return 504;
    case "ai_rate_limited":
    case "ai_quota_exceeded":
      return 429;
    case "ai_auth_failed":
      return 502;
    case "ai_bad_request":
    case "ai_invalid_output":
      return 502;
    case "ai_refused":
    case "ai_truncated":
      return 422;
    default:
      return 502;
  }
}

export function publicAiMessage(code: AiErrorCode) {
  switch (code) {
    case "ai_not_configured":
      return "AI is not configured on this server. Add the provider credentials described in the deployment notes.";
    case "ai_timeout":
      return "The AI provider did not respond in time. Your content was not saved. Try again.";
    case "ai_network":
      return "The AI provider could not be reached. Try again shortly.";
    case "ai_rate_limited":
      return "The AI provider is rate-limiting requests. Wait a moment, then try again.";
    case "ai_quota_exceeded":
      return "You have reached the AI request limit for this hour. Try again later.";
    case "ai_auth_failed":
      return "The AI provider rejected the server credentials. An administrator must check the configuration.";
    case "ai_bad_request":
      return "The AI provider rejected the request configuration. An administrator must check the model settings.";
    case "ai_refused":
      return "The model declined this request. Review the supplied text and try a narrower request.";
    case "ai_truncated":
      return "The AI response was cut off before it was complete. Nothing was saved. Try again with less source material.";
    case "ai_invalid_output":
      return "The AI provider returned a result that did not match the required structure. Nothing was saved. Try again.";
    default:
      return "The AI request could not be completed. Nothing was saved. Try again.";
  }
}

export function normalizeAiError(error: unknown): AiError {
  if (error instanceof AiError) return error;
  if (error instanceof DOMException && error.name === "AbortError") {
    return new AiError("ai_timeout");
  }
  if (error instanceof Error && error.name === "AbortError") {
    return new AiError("ai_timeout");
  }
  return new AiError("ai_provider_error", { message: error instanceof Error ? error.name : undefined });
}
