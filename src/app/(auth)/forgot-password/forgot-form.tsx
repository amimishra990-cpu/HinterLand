"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";

import { requestPasswordResetAction, type AuthState } from "@/app/(auth)/actions";
import { AuthMessage } from "@/app/(auth)/auth-message";
import { Field, Input } from "@/components/app/ui";

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    requestPasswordResetAction,
    undefined
  );

  return (
    <div>
      <p className="app-eyebrow">Account</p>
      <h1 className="mt-2 font-heading text-[32px] leading-tight">Reset your password</h1>
      <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--app-muted)" }}>
        We will email a recovery link to the address on your account.
      </p>

      {state?.success ? (
        <div className="mt-5">
          <AuthMessage tone="success">{state.success}</AuthMessage>
        </div>
      ) : (
        <>
          {state?.error ? (
            <div className="mt-5">
              <AuthMessage tone="error">{state.error}</AuthMessage>
            </div>
          ) : null}
          <form action={formAction} className="mt-4 space-y-3.5">
            <Field label="Email" htmlFor="reset-email" required>
              <Input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <button type="submit" className="app-btn app-btn-primary w-full" disabled={pending}>
              {pending ? (
                <>
                  <span className="app-spinner" aria-hidden="true" />
                  Sending…
                </>
              ) : (
                <>
                  <Send size={14} aria-hidden="true" />
                  Send recovery link
                </>
              )}
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-center text-[12px]" style={{ color: "var(--app-muted)" }}>
        <Link href="/login" className="font-medium" style={{ color: "var(--app-forest)" }}>
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
