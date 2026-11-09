import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { optionalText, requiredText } from "@/lib/validation";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const body = (await request.json().catch(() => null)) as
    | { title?: unknown; context?: unknown; excerpt?: unknown }
    | null;
  if (!body) return badRequest("A JSON body is required.");

  const title = typeof body.title === "string" ? body.title : "";
  const exampleContext = typeof body.context === "string" ? body.context : "";
  const excerpt = typeof body.excerpt === "string" ? body.excerpt : "";

  const titleError = requiredText(title, "Title", 200);
  if (titleError) return badRequest(titleError);
  const excerptError = requiredText(excerpt, "Writing sample", 10000);
  if (excerptError) return badRequest(excerptError);
  const contextError = optionalText(exampleContext, "Context", 300);
  if (contextError) return badRequest(contextError);

  const { data, error } = await context.supabase
    .from("approved_writing_examples")
    .insert({
      user_id: context.user.id,
      title: title.trim(),
      context: exampleContext.trim(),
      excerpt: excerpt.trim(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Writing example insert failed", error.message);
    return serverError("The writing example could not be saved.");
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
