import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { requireAdminApi } from "@/lib/admin/auth";
import { sameOrigin } from "@/lib/api";

const ALLOWED = new Set([
  "monitoring_retention_days",
  "issue_retention_days",
  "failed_login_alert_threshold",
]);

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const admin = await requireAdminApi();
  if (!admin.ok) return admin.response;

  const body = (await request.json().catch(() => null)) as
    | { key?: unknown; value?: unknown }
    | null;

  const key = typeof body?.key === "string" ? body.key : "";
  const rawValue = body?.value;
  const value =
    typeof rawValue === "string" ? Number(rawValue) : typeof rawValue === "number" ? rawValue : NaN;

  if (!ALLOWED.has(key) || !Number.isInteger(value)) {
    return NextResponse.json({ error: "Invalid setting." }, { status: 400 });
  }

  const { data, error } = await admin.supabase.rpc("admin_update_setting", {
    p_key: key,
    p_value: value,
  });

  if (error) {
    return NextResponse.json({ error: "The setting could not be saved." }, { status: 500 });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/admin/audit");

  return NextResponse.json({ ok: true, key, value: data });
}
