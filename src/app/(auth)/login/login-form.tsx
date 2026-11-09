"use client";

import { useActionState } from "react";
import Link from "next/link";
import { LogIn } from "lucide-react";

import { signInAction, resendVerificationAction, type AuthState } from "@/app/(auth)/actions";
import { AuthMessage } from "@/app/(auth)/auth-message";
import { Field, Input } from "@/components/app/ui";

export function LoginForm({
  next,
  reason,
  linkError,
}: {
  next: string;
  reason?: string;
  linkError?: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    signInAction,
    undefined
  );
  const [resendState, resendAction, resendPending] = useActionState<
    AuthState | undefined,
    FormData
  >(resendVerificationAction, undefined);

  return (
    <div>
      <p className="app-eyebrow">Account</p>
      <h1 className="mt-2 font-heading text-[32px] leading-tight">Sign in</h1>
      <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--app-muted)" }}>
        Your projects, documents, meetings and knowledge stay with your account.
      </p>

      <div className="mt-5 space-y-3">
        {reason === "session-expired" ? (
          <AuthMessage tone="info">Your session expired. Sign in to continue.</AuthMessage>
        ) : null}
        {linkError ? (
          <AuthMessage tone="error">
            That verification or recovery link is invalid or has expired. Request a new one.
          </AuthMessage>
        ) : null}
        {state?.error ? <AuthMessage tone="error">{state.error}</AuthMessage> : null}
        {state?.needsVerification && state.email ? (
          <div className="space-y-2">
            {resendState?.success ? (
              <AuthMessage tone="success">{resendState.success}</AuthMessage>
            ) : null}
            {resendState?.error ? (
              <AuthMessage tone="error">{resendState.error}</AuthMessage>
            ) : null}
            <form action={resendAction}>
              <input type="hidden" name="email" value={state.email} />
              <button
                type="submit"
                className="app-btn w-full justify-center"
                disabled={resendPending}
              >
                {resendPending ? (
                  <>
                    <span className="app-spinner" aria-hidden="true" />
                    Sending verification email…
                  </>
                ) : (
                  "Resend verification email"
                )}
              </button>
            </form>
          </div>
        ) : null}
      </div>

      <form action={formAction} className="mt-4 space-y-3.5">
        <input type="hidden" name="next" value={next} />
        <Field label="Email" htmlFor="login-email" required>
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
        </Field>
        <Field label="Password" htmlFor="login-password" required>
          <Input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="Your password"
            required
          />
        </Field>
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-[12px] font-medium"
            style={{ color: "var(--app-forest)" }}
          >
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="app-btn app-btn-primary w-full" disabled={pending}>
          {pending ? (
            <>
              <span className="app-spinner" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            <>
              <LogIn size={14} aria-hidden="true" />
              Sign in
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[12px]" style={{ color: "var(--app-muted)" }}>
        No account?{" "}
        <Link
          href="/register"
          className="font-medium"
          style={{ color: "var(--app-forest)" }}
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
