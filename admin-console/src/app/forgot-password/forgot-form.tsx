"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  requestPasswordResetAction,
  type AuthState,
} from "@/app/(auth)/actions";

export function AdminForgotForm() {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    requestPasswordResetAction,
    undefined
  );

  return (
    <div className="admin-theme flex min-h-dvh items-center justify-center px-4 py-10">
      <main id="main" className="admin-card w-full max-w-[420px] px-6 py-7">
        <p className="admin-eyebrow">Administrator recovery</p>
        <h1 className="mt-2 font-heading text-[26px] leading-tight">Reset password</h1>
        <p className="mt-2 text-[12.5px] leading-6 text-[var(--adm-muted)]">
          We will email a recovery link to the administrator address on file.
        </p>

        {state?.error ? (
          <div
            role="alert"
            className="mt-4 rounded-md border px-3 py-2.5 text-[12px]"
            style={{
              color: "var(--adm-red)",
              backgroundColor: "var(--adm-red-soft)",
              borderColor: "rgba(156,68,54,.3)",
            }}
          >
            {state.error}
          </div>
        ) : null}
        {state?.success ? (
          <div
            role="status"
            className="mt-4 rounded-md border px-3 py-2.5 text-[12px]"
            style={{
              color: "var(--adm-forest)",
              backgroundColor: "var(--adm-sage-soft)",
              borderColor: "rgba(48,78,62,.25)",
            }}
          >
            {state.success}
          </div>
        ) : null}

        <form action={formAction} className="mt-5 space-y-3.5">
          <div>
            <label className="admin-label" htmlFor="recovery-email">
              Administrator email
            </label>
            <input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="admin-input mt-1"
              defaultValue={state?.email ?? ""}
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={pending}>
            {pending ? <span className="admin-spinner" aria-label="Sending" /> : null}
            {pending ? "Sending link" : "Send recovery link"}
          </button>
        </form>

        <Link href="/login" className="admin-link mt-4 inline-block text-[11.5px]">
          Back to sign in
        </Link>
      </main>
    </div>
  );
}
