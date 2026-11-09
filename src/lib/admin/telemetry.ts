import "server-only";

import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  isSupabaseConfigured,
} from "@/lib/supabase/config";

export type IssueSeverity = "critical" | "error" | "warning" | "info";

export type IssueInput = {
  category: string;
  message: string;
  severity?: IssueSeverity;
  route?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
};

const MAX_MESSAGE = 1200;

const EMAIL_PATTERN = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const JWT_PATTERN = /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g;
const KEY_PATTERN = /sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g;
const BEARER_PATTERN = /bearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const SECRET_ASSIGNMENT_PATTERN =
  /(password|passwd|secret|token|api[_-]?key|authorization)\s*[:=]\s*["']?[^\s"',;}]{3,}/gi;

export function sanitizeText(value: string, max = MAX_MESSAGE) {
  return value
    .replace(JWT_PATTERN, "[token]")
    .replace(KEY_PATTERN, "[key]")
    .replace(BEARER_PATTERN, "Bearer [redacted]")
    .replace(SECRET_ASSIGNMENT_PATTERN, "$1=[redacted]")
    .replace(EMAIL_PATTERN, "[email]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function sanitizeRoute(value: string | null | undefined) {
  if (!value) return null;
  const path = value.split("?")[0]?.split("#")[0] ?? "";
  if (!path.startsWith("/")) return null;
  return path.replace(/[^A-Za-z0-9/_.\-[\]]/g, "").slice(0, 300) || null;
}

export function fingerprintIssue(parts: Array<string | null | undefined>) {
  return createHash("sha256")
    .update(parts.map((part) => part ?? "").join("|"))
    .digest("hex");
}

function sanitizeMetadata(value: unknown, depth = 0): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || depth > 2) {
    return {};
  }
  const output: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    if (Object.keys(output).length >= 20) break;
    const safeKey = key.replace(/[^A-Za-z0-9_.-]/g, "").slice(0, 40);
    if (!safeKey) continue;
    if (typeof entry === "string") {
      output[safeKey] = sanitizeText(entry, 300);
    } else if (typeof entry === "number" || typeof entry === "boolean" || entry === null) {
      output[safeKey] = entry;
    } else if (entry && typeof entry === "object" && depth < 2) {
      output[safeKey] = sanitizeMetadata(entry, depth + 1);
    }
  }
  return output;
}

export function environmentName() {
  if (process.env.VERCEL_ENV) return process.env.VERCEL_ENV;
  return process.env.NODE_ENV ?? "development";
}

export function appVersion() {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ??
    process.env.NEXT_PUBLIC_APP_VERSION ??
    "dev"
  );
}

export function deviceCategory(userAgent: string | null | undefined) {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return "";
  if (/bot|crawler|spider|headless/.test(ua)) return "Bot";
  if (/ipad|tablet|kindle|playbook/.test(ua)) return "Tablet";
  if (/mobile|iphone|android/.test(ua)) return "Mobile";
  return "Desktop";
}

function telemetryClient() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Writes a sanitized issue record. Never throws: monitoring failures must not
 * break the request that triggered them.
 */
export async function reportIssue(input: IssueInput): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const message = sanitizeText(input.message || "Unknown error");
    const route = sanitizeRoute(input.route);
    const severity = input.severity ?? "error";
    const fingerprint = fingerprintIssue([input.category, route, message, severity]);

    const { error } = await telemetryClient().rpc("record_app_issue", {
      p_fingerprint: fingerprint,
      p_severity: severity,
      p_category: input.category.slice(0, 80),
      p_message: message,
      p_route: route,
      p_environment: environmentName(),
      p_app_version: appVersion(),
      p_correlation_id: input.correlationId ?? null,
      p_metadata: sanitizeMetadata(input.metadata),
    });

    if (error) {
      console.error("Issue reporting failed", error.message);
    }
  } catch (error) {
    console.error(
      "Issue reporting failed",
      error instanceof Error ? error.message : "unknown"
    );
  }
}

export async function recordPublicAuthEvent(
  eventType: "login_failed" | "password_recovery_requested",
  input: { email: string; success: boolean; reason?: string | null }
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await telemetryClient().rpc("record_public_auth_event", {
      p_event_type: eventType,
      p_email: input.email,
      p_success: input.success,
      p_reason: input.reason ?? null,
    });
  } catch (error) {
    console.error(
      "Auth event logging failed",
      error instanceof Error ? error.message : "unknown"
    );
  }
}

export async function recordOwnAuthEvent(
  supabase: SupabaseClient,
  eventType:
    | "login"
    | "logout"
    | "password_updated"
    | "email_verified"
    | "session_expired"
): Promise<void> {
  try {
    await supabase.rpc("record_own_auth_event", { p_event_type: eventType });
  } catch (error) {
    console.error(
      "Auth event logging failed",
      error instanceof Error ? error.message : "unknown"
    );
  }
}
