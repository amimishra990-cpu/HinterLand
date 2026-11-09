"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";

import { updatePasswordAction, type AuthState } from "@/app/(auth)/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={pending}>
      {pending ? <span className="admin-spinner" aria-label="Saving" /> : null}
      {pending ? "Saving password" : "Set new password"}
    </button>
  );
}

export function AdminSetPasswordForm() {
  const [state, formAction] = useActionState<AuthState | undefined, FormData>(
    updatePasswordAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-5 space-y-3.5">
      {state?.error ? (
        <div
          role="alert"
          className="rounded-md border px-3 py-2 text-[12px]"
          style={{
            borderColor: "rgba(156, 68, 54, 0.3)",
            backgroundColor: "var(--adm-red-soft)",
            color: "var(--adm-red)",
          }}
        >
          {state.error}
        </div>
      ) : null}
      <div>
        <label htmlFor="admin-new-password" className="admin-label">
          New password
        </label>
        <input
          id="admin-new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="admin-input"
        />
        <p className="mt-1 text-[11px] text-[var(--adm-muted)]">
          At least 8 characters, including a letter and a number. Use a password unique to
          this console.
        </p>
      </div>
      <div>
        <label htmlFor="admin-confirm-password" className="admin-label">
          Confirm new password
        </label>
        <input
          id="admin-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={128}
          required
          className="admin-input"
        />
      </div>
      <SubmitButton />
      <p className="flex items-start gap-1.5 text-[11px] leading-4 text-[var(--adm-muted)]">
        <KeyRound size={12} className="mt-0.5 shrink-0" aria-hidden="true" />
        The console stays locked until this password is changed. Nothing is written to logs
        or exposed through an API.
      </p>
    </form>
  );
}
