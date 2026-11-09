"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseEnvironmentIssue } from "@/lib/supabase/config";
import { getSiteUrl } from "@/lib/site-url";
import {
  recordOwnAuthEvent,
  recordPublicAuthEvent,
} from "@/lib/admin/telemetry";
import {
  isValidEmail,
  normalizeEmail,
  passwordProblem,
  safeRedirectPath,
} from "@/lib/validation";

export type AuthState = {
  error?: string;
  success?: string;
  email?: string;
  needsVerification?: boolean;
};

function configurationError(): AuthState {
  return {
    error:
      supabaseEnvironmentIssue() ??
      "Supabase is not configured. Add the project URL and publishable key.",
  };
}

function authErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm the administrator email address before signing in.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  return "Authentication failed. Please try again.";
}

function authFailureCode(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) return "invalid_credentials";
  if (lower.includes("email not confirmed")) return "email_not_confirmed";
  if (lower.includes("rate limit") || lower.includes("too many")) return "rate_limited";
  return "authentication_failed";
}

function adminNext(value: FormDataEntryValue | null) {
  const next = safeRedirectPath(value);
  return next.startsWith("/admin") ? next : "/admin";
}

export async function signInAction(
  _previous: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return configurationError();

  const rawIdentifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = adminNext(formData.get("next"));

  if (!rawIdentifier || rawIdentifier.length > 254) {
    return { error: "Enter your email address or username." };
  }
  if (!password) return { error: "Enter your password." };

  const supabase = await createClient();

  let email = normalizeEmail(rawIdentifier);
  if (!rawIdentifier.includes("@")) {
    const { data: resolved, error: resolveError } = await supabase.rpc(
      "resolve_login_email",
      { p_identifier: rawIdentifier }
    );
    if (resolveError || typeof resolved !== "string" || !resolved) {
      return { error: "Email or username is incorrect." };
    }
    email = normalizeEmail(resolved);
  }

  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await recordPublicAuthEvent("login_failed", {
      email,
      success: false,
      reason: authFailureCode(error.message),
    });
    return { error: authErrorMessage(error.message), email };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, must_change_password")
    .eq("id", data.user.id)
    .maybeSingle();

  const adminProfile = profile as
    | { is_admin: boolean; must_change_password: boolean }
    | null;

  if (!adminProfile?.is_admin) {
    await recordPublicAuthEvent("login_failed", {
      email,
      success: false,
      reason: "not_admin",
    });
    await supabase.auth.signOut({ scope: "local" });
    return { error: "This account does not have administrator access." };
  }

  await recordOwnAuthEvent(supabase, "login");
  await supabase.rpc("record_admin_login");

  if (adminProfile.must_change_password) {
    redirect("/admin/set-password");
  }

  redirect(next);
}

export async function signOutAction() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) await recordOwnAuthEvent(supabase, "logout");
    await supabase.auth.signOut({ scope: "local" });
  }
  redirect("/login");
}

export async function requestPasswordResetAction(
  _previous: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return configurationError();

  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  await recordPublicAuthEvent("password_recovery_requested", {
    email,
    success: !error,
    reason: error ? "request_failed" : null,
  });

  if (error) return { error: authErrorMessage(error.message) };

  return {
    success:
      "If an administrator account exists for that address, a password reset link is on its way.",
    email,
  };
}

export async function updatePasswordAction(
  _previous: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return configurationError();

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  const passwordIssue = passwordProblem(password);
  if (passwordIssue) return { error: passwordIssue };
  if (password !== confirmation) return { error: "The passwords do not match." };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return {
      error:
        "This recovery link is invalid or has expired. Request a new password reset email.",
    };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (!(profile as { is_admin: boolean } | null)?.is_admin) {
    await supabase.auth.signOut({ scope: "local" });
    return { error: "This account does not have administrator access." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error.message) };

  await recordOwnAuthEvent(supabase, "password_updated");
  await supabase.rpc("complete_admin_password_change");

  redirect("/admin");
}
