"use client";

import { useActionState } from "react";
import Link from "next/link";

import { updatePasswordAction, type AuthState } from "@/app/(auth)/actions";

export function AdminResetForm() {
  const [state, formAction, pending] = useActionState<AuthState | undefined, FormData>(
    updatePasswordAction,
    undefined
  );

  return (
    <div className="admin-theme flex min-h-dvh items-center justify-center px-4 py-10">
      <main id="main" className="admin-card w-full max-w-[420px] px-6 py-7">
        <p className="admin-eyebrow">Administrator recovery</p>
        <h1 className="mt-2 font-heading text-[26px] leading-tight">Choose a new password</h1>
        <p className="mt-2 text-[12.5px] leading-6 text-[var(--adm-muted)]">
          The recovery link signs you in only long enough to set a new password. You will
          land in the console afterwards.
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
            <span className="mt-2 block">
              <Link href="/forgot-password" className="admin-link">
                Request a new recovery link
              </Link>
            </span>
          </div>
        ) : null}

        <form action={formAction} className="mt-5 space-y-3.5">
          <div>
            <label className="admin-label" htmlFor="new-password">
              New password
            </label>
            <input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="admin-input mt-1"
            />
          </div>
          <div>
            <label className="admin-label" htmlFor="confirm-password">
              Confirm new password
            </label>
            <input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              className="admin-input mt-1"
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={pending}>
            {pending ? <span className="admin-spinner" aria-label="Saving" /> : null}
            {pending ? "Saving password" : "Set new password"}
          </button>
        </form>
      </main>
    </div>
  );
}
