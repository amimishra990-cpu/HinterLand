import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeRedirectPath } from "@/lib/validation";
import { recordOwnAuthEvent } from "@/lib/telemetry";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = safeRedirectPath(url.searchParams.get("next"));
  const fallback = type === "recovery" ? "/reset-password" : next;

  if (!isSupabaseConfigured()) {
    return NextResponse.redirect(new URL("/login?error=not-configured", url.origin));
  }

  const supabase = await createClient();

  let errorMessage: string | null = null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    errorMessage = error?.message ?? null;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email",
    });
    errorMessage = error?.message ?? null;
  } else {
    errorMessage = "The verification link is missing its token.";
  }

  if (errorMessage) {
    const target = new URL("/login", url.origin);
    target.searchParams.set("error", "link-invalid");
    return NextResponse.redirect(target);
  }

  if (type === "signup" || type === "email") {
    await recordOwnAuthEvent(supabase, "email_verified");
  }

  return NextResponse.redirect(new URL(fallback, url.origin));
}
