import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { AiConfig } from "@/lib/ai/config";
import { AiError } from "@/lib/ai/errors";

export async function assertWithinQuota(
  supabase: SupabaseClient,
  userId: string,
  config: AiConfig
) {
  const since = new Date(Date.now() - 60 * 60 * 1_000).toISOString();
  const { count, error } = await supabase
    .from("ai_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);

  if (error) {
    console.error("ai_runs quota check failed", error.code);
    return;
  }
  if ((count ?? 0) >= config.requestsPerHour) {
    throw new AiError("ai_quota_exceeded", { retryable: false });
  }
}
