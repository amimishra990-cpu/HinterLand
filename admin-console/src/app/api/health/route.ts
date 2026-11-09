import { NextResponse } from "next/server";

import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const checkedAt = new Date().toISOString();

  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { status: "unconfigured", service: "hinterland-admin", checkedAt },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.rpc("public_health");

    if (error) throw new Error(error.message);

    return NextResponse.json(
      {
        status: "ok",
        service: "hinterland-admin",
        version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "dev",
        environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
        checkedAt,
      },
      { headers: { "cache-control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", service: "hinterland", checkedAt },
      { status: 503, headers: { "cache-control": "no-store" } }
    );
  }
}
