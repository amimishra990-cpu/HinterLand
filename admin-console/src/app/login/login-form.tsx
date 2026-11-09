"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import { signInAction, type AuthState } from "@/app/(auth)/actions";

export function AdminLoginForm({
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

  return (
    <div className="admin-theme flex min-h-dvh flex-col items-center justify-center px-4 py-10">
      <main id="main" className="w-full max-w-[420px]">
        <div className="mb-6 flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-sm border border-[rgba(201,173,117,0.55)] font-heading text-[17px] text-[var(--adm-gold)]"
            style={{ backgroundColor: "#222c25" }}
          >
            H
          </span>
          <div>
            <p className="font-heading text-[19px] leading-none text-[var(--adm-ink)]">
              HINTERLAND
            </p>
            <p className="mt-1 text-[10.5px] tracking-[0.16em] text-[var(--adm-muted)]">
              ADMINISTRATION
            </p>
          </div>
        </div>

        <div className="admin-card px-6 py-7">
          <p className="admin-eyebrow flex items-center gap-1.5">
            <ShieldCheck size={12} aria-hidden="true" />
            Restricted access
          </p>
          <h1 className="mt-2 font-heading text-[28px] leading-tight">Administrator sign in</h1>
          <p className="mt-2 text-[12.5px] leading-6 text-[var(--adm-muted)]">
            This console is separate from the public HINTERLAND site and is limited to
            authorised administrators.
          </p>

          {reason === "session-expired" ? (
            <div
              role="status"
              className="mt-4 rounded-md border border-[var(--adm-line)] bg-[var(--adm-panel-soft)] px-3 py-2.5 text-[12px] text-[var(--adm-ink-soft)]"
            >
              Your session expired. Sign in to continue.
            </div>
          ) : null}

          {linkError ? (
            <div
              role="alert"
              className="mt-4 rounded-md border px-3 py-2.5 text-[12px]"
              style={{
                color: "var(--adm-red)",
                backgroundColor: "var(--adm-red-soft)",
                borderColor: "rgba(156,68,54,.3)",
              }}
            >
              That sign-in link is invalid or expired. Request a new one below.
            </div>
          ) : null}

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

          <form action={formAction} className="mt-5 space-y-3.5">
            <input type="hidden" name="next" value={next} />
            <div>
              <label className="admin-label" htmlFor="admin-identifier">
                Email or username
              </label>
              <input
                id="admin-identifier"
                name="email"
                type="text"
                autoComplete="username"
                required
                maxLength={254}
                className="admin-input mt-1"
                placeholder="nameless.monster"
                defaultValue={state?.email ?? ""}
              />
            </div>
            <div>
              <label className="admin-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="admin-input mt-1"
              />
            </div>

            <button type="submit" className="admin-btn admin-btn-primary w-full" disabled={pending}>
              {pending ? <span className="admin-spinner" aria-label="Signing in" /> : null}
              {pending ? "Signing in" : "Sign in"}
            </button>
          </form>

          <div className="mt-4 flex items-center justify-between text-[11.5px]">
            <Link href="/forgot-password" className="admin-link">
              Forgot password?
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_MAIN_SITE_URL ?? "https://hinter-land.vercel.app"}
              className="text-[var(--adm-muted)] hover:text-[var(--adm-ink)]"
            >
              Public site
            </a>
          </div>
        </div>

        <p className="mt-4 text-center text-[10.5px] leading-4 text-[var(--adm-muted)]">
          Sign-in attempts are recorded. Unauthorised access is prohibited.
        </p>
      </main>
    </div>
  );
}
