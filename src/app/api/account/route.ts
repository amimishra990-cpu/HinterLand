import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_STORAGE_BUCKET,
  SUPABASE_URL,
} from "@/lib/supabase/config";

export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return badRequest("A JSON body is required.");
  }

  const payload = (body ?? {}) as Record<string, unknown>;
  const password = typeof payload.password === "string" ? payload.password : "";
  const confirmation =
    typeof payload.confirmation === "string" ? payload.confirmation.trim() : "";

  if (confirmation !== "DELETE") {
    return badRequest('Type DELETE in the confirmation field to continue.');
  }
  if (!password) return badRequest("Enter your password to confirm.");
  if (!context.user.email) {
    return badRequest("This account has no email address to verify against.");
  }

  const verifier = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  const { error: verifyError } = await verifier.auth.signInWithPassword({
    email: context.user.email,
    password,
  });
  if (verifyError) {
    return NextResponse.json(
      { error: "The password could not be verified." },
      { status: 403 }
    );
  }
  await verifier.auth.signOut();

  const { data: documents, error: documentsError } = await context.supabase
    .from("documents")
    .select("storage_path")
    .eq("user_id", context.user.id);

  if (documentsError) {
    console.error("Account deletion document lookup failed", documentsError.message);
    return serverError("Your files could not be listed. Nothing was deleted.");
  }

  const recordedPaths = (documents ?? [])
    .map((row) => row.storage_path as string | null)
    .filter((path): path is string => Boolean(path));

  const listAllObjects = async (prefix: string): Promise<string[]> => {
    const found: string[] = [];
    const pageSize = 100;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await context.supabase.storage
        .from(SUPABASE_STORAGE_BUCKET)
        .list(prefix, { limit: pageSize, offset });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const entry of data) {
        const fullPath = `${prefix}/${entry.name}`;
        if (entry.id === null) {
          found.push(...(await listAllObjects(fullPath)));
        } else {
          found.push(fullPath);
        }
      }
      if (data.length < pageSize) break;
    }
    return found;
  };

  let storedPaths: string[] = [];
  try {
    storedPaths = await listAllObjects(context.user.id);
  } catch (storageListError) {
    console.error(
      "Account deletion storage listing failed",
      (storageListError as Error).message
    );
    return serverError("Your stored files could not be listed. Nothing was deleted.");
  }

  const paths = [...new Set([...recordedPaths, ...storedPaths])];

  for (let index = 0; index < paths.length; index += 100) {
    const { error: storageError } = await context.supabase.storage
      .from(SUPABASE_STORAGE_BUCKET)
      .remove(paths.slice(index, index + 100));
    if (storageError) {
      console.error("Account deletion storage cleanup failed", storageError.message);
      return serverError("Your stored files could not be deleted. Nothing was deleted.");
    }
  }

  const { error: deleteError } = await context.supabase.rpc("delete_current_account");
  if (deleteError) {
    console.error("Account deletion failed", deleteError.message);
    return serverError("The account could not be deleted.");
  }

  await context.supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
