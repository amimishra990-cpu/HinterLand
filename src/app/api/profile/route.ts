import { NextResponse } from "next/server";

import {
  badRequest,
  crossOriginResponse,
  getApiContext,
  sameOrigin,
  serverError,
} from "@/lib/api";
import { optionalText, requiredText } from "@/lib/validation";

export async function PATCH(request: Request) {
  if (!sameOrigin(request)) return crossOriginResponse();
  const context = await getApiContext();
  if (!context.ok) return context.response;

  const body = (await request.json().catch(() => null)) as
    | {
        fullName?: unknown;
        role?: unknown;
        notificationPreferences?: unknown;
      }
    | null;
  if (!body) return badRequest("A JSON body is required.");

  const fullName = typeof body.fullName === "string" ? body.fullName : "";
  const role = typeof body.role === "string" ? body.role : "";
  const nameError = requiredText(fullName, "Full name", 120);
  if (nameError) return badRequest(nameError);
  const roleError = optionalText(role, "Role", 80);
  if (roleError) return badRequest(roleError);

  const update: Record<string, unknown> = {
    full_name: fullName.trim(),
    role: role.trim() || "Member",
  };

  if (body.notificationPreferences !== undefined) {
    const prefs = body.notificationPreferences;
    if (!prefs || typeof prefs !== "object") {
      return badRequest("Notification preferences are invalid.");
    }
    const record = prefs as Record<string, unknown>;
    if (
      typeof record.meetingReminders !== "boolean" ||
      typeof record.approvalRequests !== "boolean" ||
      typeof record.weeklySummary !== "boolean"
    ) {
      return badRequest("Notification preferences must be boolean values.");
    }
    update.notification_preferences = {
      meetingReminders: record.meetingReminders,
      approvalRequests: record.approvalRequests,
      weeklySummary: record.weeklySummary,
    };
  }

  const { data, error } = await context.supabase
    .from("profiles")
    .update(update)
    .eq("id", context.user.id)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Profile update failed", error.message);
    return serverError("Your profile could not be saved.");
  }
  if (!data) {
    const { error: insertError } = await context.supabase
      .from("profiles")
      .insert({ id: context.user.id, ...update });
    if (insertError) {
      console.error("Profile insert failed", insertError.message);
      return serverError("Your profile could not be created.");
    }
  }

  return NextResponse.json({ ok: true });
}
