"use client";

import { useActionState } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";

import { signUpAction, type AuthState } from "@/app/(auth)/actions";
import { AuthMessage } from "@/app/(auth)/auth-message";
import { Field, Input } from "@/components/app/ui";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    signUpAction,
    undefined
  );

  return (
    <div>
      <p className="app-eyebrow">Account</p>
      <h1 className="mt-2 font-heading text-[32px] leading-tight">Create your account</h1>
      <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--app-muted)" }}>
        One private workspace for the context behind your work.
      </p>

      {state?.success ? (
        <div className="mt-5 space-y-3">
          <AuthMessage tone="success">{state.success}</AuthMessage>
          <p className="text-[12px]" style={{ color: "var(--app-muted)" }}>
            Next: open the link in your email, then{" "}
            <Link href="/login" className="font-medium" style={{ color: "var(--app-forest)" }}>
              sign in
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          {state?.error ? (
            <div className="mt-5">
              <AuthMessage tone="error">{state.error}</AuthMessage>
            </div>
          ) : null}

          <form action={formAction} className="mt-4 space-y-3.5">
            <Field label="Full name" htmlFor="register-name" required>
              <Input
                id="register-name"
                name="fullName"
                autoComplete="name"
                placeholder="Your name"
                required
                minLength={2}
                maxLength={120}
              />
            </Field>
            <Field label="Email" htmlFor="register-email" required>
              <Input
                id="register-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <Field
              label="Password"
              htmlFor="register-password"
              hint="At least 8 characters, including a letter and a number."
              required
            >
              <Input
                id="register-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
              />
            </Field>
            <Field label="Confirm password" htmlFor="register-confirm" required>
              <Input
                id="register-confirm"
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
                  Creating account…
                </>
              ) : (
                <>
                  <UserPlus size={14} aria-hidden="true" />
                  Create account
                </>
              )}
            </button>
          </form>
        </>
      )}

      <p className="mt-5 text-center text-[12px]" style={{ color: "var(--app-muted)" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium" style={{ color: "var(--app-forest)" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
