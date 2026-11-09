import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/api";

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const { data, error } = await admin.supabase.rpc("admin_purge_telemetry");

  if (error) {
    return NextResponse.json(
      { error: "The retention cleanup could not be completed." },
      { status: 500 }
    );
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit");
  revalidatePath("/admin/login-activity");
  revalidatePath("/admin/issues");

  return NextResponse.json({ ok: true, result: data });
}
