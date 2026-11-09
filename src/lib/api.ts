import "server-only";

import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseEnvironmentIssue } from "@/lib/supabase/config";
import { reportIssue } from "@/lib/telemetry";

type ApiContext =
  | {
      ok: true;
      supabase: Awaited<ReturnType<typeof createClient>>;
      user: User;
    }
  | { ok: false; response: NextResponse };

export async function getApiContext(): Promise<ApiContext> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Supabase is not configured.",
          detail:
            supabaseEnvironmentIssue() ??
            "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.",
        },
        { status: 503 }
      ),
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      ),
    };
  }

  return { ok: true, supabase, user: data.user };
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const originUrl = new URL(origin);
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    return Boolean(host) && originUrl.host === host;
  } catch {
    return false;
  }
}

export function crossOriginResponse() {
  return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Record not found.") {
  return NextResponse.json({ error: message }, { status: 404 });
}

export function serverError(message = "The request could not be completed.") {
  void reportIssue({
    category: "api",
    severity: "error",
    message,
    metadata: { status: 500 },
  });
  return NextResponse.json({ error: message }, { status: 500 });
}
