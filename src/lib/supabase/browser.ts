"use client";

import { createBrowserClient } from "@supabase/ssr";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createBrowserSupabaseClient() {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    browserClient = createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return browserClient;
}
