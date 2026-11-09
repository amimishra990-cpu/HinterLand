"use client";

import { useActionState } from "react";
import Link from "next/link";
import { KeyRound } from "lucide-react";

import { updatePasswordAction, type AuthState } from "@/app/(auth)/actions";
import { AuthMessage } from "@/app/(auth)/auth-message";
import { Field, Input } from "@/components/app/ui";

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    updatePasswordAction,
    undefined
  );

  return (
    <div>
      <p className="app-eyebrow">Account</p>
      <h1 className="mt-2 font-heading text-[32px] leading-tight">Choose a new password</h1>
      <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--app-muted)" }}>
        Your recovery link signs you in just long enough to set a new password.
      </p>

      {state?.error ? (
        <div className="mt-5 space-y-3">
          <AuthMessage tone="error">{state.error}</AuthMessage>
          <Link
            href="/forgot-password"
            className="text-[12px] font-medium"
            style={{ color: "var(--app-forest)" }}
          >
            Request a new recovery link
          </Link>
        </div>
      ) : null}

      <form action={formAction} className="mt-4 space-y-3.5">
        <Field
          label="New password"
          htmlFor="new-password"
          hint="At least 8 characters, including a letter and a number."
          required
        >
          <Input
            id="new-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm-password" required>
          <Input
            id="confirm-password"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            minLength={8}
            maxLength={128}
            required
          />
        </Field>
        <button type="submit" className="app-btn app-btn-primary w-full" disabled={pending}>
          {pending ? (
            <>
              <span className="app-spinner" aria-hidden="true" />
              Updating…
            </>
          ) : (
            <>
              <KeyRound size={14} aria-hidden="true" />
              Update password
            </>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-[12px]" style={{ color: "var(--app-muted)" }}>
        <Link href="/login" className="font-medium" style={{ color: "var(--app-forest)" }}>
          Return to sign in
        </Link>
      </p>
    </div>
  );
}
