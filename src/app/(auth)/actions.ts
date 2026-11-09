"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured, supabaseEnvironmentIssue } from "@/lib/supabase/config";
import { getSiteUrl } from "@/lib/site-url";
import {
  recordOwnAuthEvent,
  recordPublicAuthEvent,
} from "@/lib/telemetry";
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
      "Supabase is not configured. Add the project URL and publishable key in .env.local.",
  };
}

function authErrorMessage(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Email or password is incorrect.";
  }
  if (lower.includes("email not confirmed")) {
    return "Confirm your email address before signing in. Check your inbox for the verification link.";
  }
  if (lower.includes("user already registered")) {
    return "An account with this email already exists. Sign in or reset your password.";
  }
  if (lower.includes("email rate limit") || lower.includes("over_email_send_rate_limit")) {
    return "Email sending is temporarily rate-limited. Wait a few minutes, then request another verification email.";
  }
  if (lower.includes("rate limit") || lower.includes("too many")) {
    return "Too many attempts. Wait a moment and try again.";
  }
  if (lower.includes("password")) {
    return "That password could not be accepted. Use at least 8 characters with a letter and a number.";
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

export async function signInAction(
  _previous: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return configurationError();

  const rawIdentifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(formData.get("next"));

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    await recordPublicAuthEvent("login_failed", {
      email,
      success: false,
      reason: authFailureCode(error.message),
    });
    return {
      error: authErrorMessage(error.message),
      email,
      needsVerification: error.message.toLowerCase().includes("email not confirmed"),
    };
  }

  await recordOwnAuthEvent(supabase, "login");

  redirect(next);
}

export async function signUpAction(
  _previous: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return configurationError();

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");

  if (fullName.length < 2 || fullName.length > 120) {
    return { error: "Enter your name (2–120 characters)." };
  }
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };
  const passwordIssue = passwordProblem(password);
  if (passwordIssue) return { error: passwordIssue };
  if (password !== confirmation) return { error: "The passwords do not match." };

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=/app`,
      data: { full_name: fullName },
    },
  });

  if (error) return { error: authErrorMessage(error.message) };

  if (data.session) redirect("/app");

  return {
    success:
      "Account created. Open the verification link we sent to your email, then sign in.",
    email,
  };
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
      "If an account exists for that address, a password reset link is on its way. The link expires shortly after it is sent.",
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

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error.message) };

  await recordOwnAuthEvent(supabase, "password_updated");

  redirect("/app");
}

export async function resendVerificationAction(
  _previous: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  if (!isSupabaseConfigured()) return configurationError();

  const email = normalizeEmail(formData.get("email"));
  if (!isValidEmail(email)) return { error: "Enter a valid email address." };

  const siteUrl = await getSiteUrl();
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${siteUrl}/auth/callback?next=/app` },
  });

  if (error) return { error: authErrorMessage(error.message) };

  return {
    success: "Verification email sent. Check your inbox and spam folder.",
    email,
  };
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
