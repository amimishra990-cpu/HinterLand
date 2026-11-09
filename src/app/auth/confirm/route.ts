import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next");
  const fallback = type === "recovery" || next === "/reset-password" ? "/reset-password" : "/app";

  if (!isSupabaseConfigured() || !tokenHash || !type) {
    return NextResponse.redirect(new URL("/login?error=link-invalid", url.origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
  });

  if (error) {
    return NextResponse.redirect(new URL("/login?error=link-invalid", url.origin));
  }

  return NextResponse.redirect(new URL(fallback, url.origin));
}
