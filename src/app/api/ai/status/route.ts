import { NextResponse } from "next/server";

import { getApiContext } from "@/lib/api";
import { aiStatus } from "@/lib/ai/config";

export async function GET() {
  const context = await getApiContext();
  if (!context.ok) return context.response;

  return NextResponse.json(aiStatus(), {
    headers: { "cache-control": "no-store" },
  });
}
