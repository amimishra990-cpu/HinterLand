export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";

export const SUPABASE_STORAGE_BUCKET = "documents";

export function isSupabaseConfigured() {
  return Boolean(
    SUPABASE_URL &&
      SUPABASE_PUBLISHABLE_KEY &&
      /^https?:\/\//.test(SUPABASE_URL) &&
      !SUPABASE_URL.includes("your-project")
  );
}

export function supabaseEnvironmentIssue() {
  if (!SUPABASE_URL) {
    return "NEXT_PUBLIC_SUPABASE_URL is not set.";
  }
  if (!SUPABASE_PUBLISHABLE_KEY) {
    return "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is not set.";
  }
  if (!/^https?:\/\//.test(SUPABASE_URL)) {
    return "NEXT_PUBLIC_SUPABASE_URL must be a full https:// project URL.";
  }
  return null;
}
