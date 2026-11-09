import { NextResponse } from "next/server";

import { getApiContext, serverError } from "@/lib/api";
import { loadWorkspaceData } from "@/lib/workspace";


export async function GET() {
  const context = await getApiContext();
  if (!context.ok) return context.response;

  try {
    const data = await loadWorkspaceData(context.supabase, context.user);
    return NextResponse.json(
      {
        ...data,
        user: { id: context.user.id, email: context.user.email },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Workspace load failed", error);
    return serverError(
      error instanceof Error ? error.message : "Workspace data could not be loaded."
    );
  }
}
