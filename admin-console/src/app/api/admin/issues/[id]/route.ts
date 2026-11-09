import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/api";

const ALLOWED = new Set(["open", "investigating", "resolved", "ignored"]);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { id } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid issue id." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as { status?: unknown } | null;
  const status = typeof body?.status === "string" ? body.status : "";
  if (!ALLOWED.has(status)) {
    return NextResponse.json({ error: "Unsupported status." }, { status: 400 });
  }

  const { data, error } = await admin.supabase.rpc("admin_update_issue_status", {
    p_issue_id: id,
    p_status: status,
  });

  if (error) {
    if (error.code === "P0002") {
      return NextResponse.json({ error: "Issue not found." }, { status: 404 });
    }
    return NextResponse.json({ error: "The issue could not be updated." }, { status: 500 });
  }

  revalidatePath("/admin/issues");
  revalidatePath(`/admin/issues/${id}`);
  revalidatePath("/admin/audit");

  return NextResponse.json({ ok: true, issue: data });
}
