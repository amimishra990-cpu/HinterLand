"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Database, LockKeyhole, RefreshCw } from "lucide-react";

import { AppShell } from "@/components/app/app-shell";
import { WorkspaceProvider } from "@/components/app/workspace-provider";
import { WorkspaceFallback } from "@/components/app/workspace-fallback";
import { Button } from "@/components/app/ui";
import type { WorkspacePayload } from "@/lib/workspace-types";

type GateState =
  | { status: "loading" }
  | { status: "ready"; data: WorkspacePayload }
  | { status: "unconfigured"; detail?: string }
  | { status: "error"; message: string };

export function WorkspaceGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<GateState>({ status: "loading" });

  const fetchWorkspace = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const response = await fetch("/api/workspace", {
          credentials: "same-origin",
          cache: "no-store",
          signal,
        });
        const body = await response.json().catch(() => null);

        if (response.status === 401) {
          router.replace("/login?reason=session-expired");
          return;
        }
        if (response.status === 503) {
          setState({
            status: "unconfigured",
            detail:
              body && typeof body === "object" && typeof body.detail === "string"
                ? body.detail
                : undefined,
          });
          return;
        }
        if (!response.ok || !body) {
          setState({
            status: "error",
            message:
              body && typeof body === "object" && typeof body.error === "string"
                ? body.error
                : "The workspace could not be loaded.",
          });
          return;
        }
        setState({ status: "ready", data: body as WorkspacePayload });
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        setState({
          status: "error",
          message: "The workspace could not be reached. Check your connection and try again.",
        });
      }
    },
    [router]
  );

  const reload = useCallback(() => {
    setState({ status: "loading" });
    void fetchWorkspace();
  }, [fetchWorkspace]);

  useEffect(() => {
    const controller = new AbortController();
    // State is only set after the awaited request settles; the fetch has to start from an effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchWorkspace(controller.signal);
    return () => controller.abort();
  }, [fetchWorkspace]);

  if (state.status === "loading") {
    return (
      <div className="app-theme min-h-dvh">
        <div className="mx-auto w-full max-w-[1320px] px-4 py-10 sm:px-6 lg:px-8">
          <WorkspaceFallback />
        </div>
      </div>
    );
  }

  if (state.status === "unconfigured") {
    return (
      <div className="app-theme flex min-h-dvh items-center justify-center px-4 py-12">
        <div className="app-card w-full max-w-[640px] p-6 sm:p-8">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--app-gold-soft)", color: "var(--app-gold)" }}
          >
            <Database size={20} aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-[28px] leading-tight">
            Supabase configuration required
          </h1>
          <p className="mt-2 text-[13px] leading-6" style={{ color: "var(--app-muted)" }}>
            The workspace is protected by Supabase authentication, but this deployment has no
            Supabase project configured. Add the two public values below to{" "}
            <code>.env.local</code>, run the migrations in <code>supabase/migrations</code>, and
            restart the server.
          </p>
          {state.detail ? (
            <p
              className="mt-3 rounded-md px-3 py-2 text-[11.5px]"
              style={{ backgroundColor: "var(--app-terracotta-soft)", color: "var(--app-terracotta)" }}
            >
              {state.detail}
            </p>
          ) : null}
          <pre
            className="mt-4 overflow-x-auto rounded-md border px-4 py-3 text-[11.5px] leading-6"
            style={{ borderColor: "var(--app-line)", backgroundColor: "var(--app-panel-soft)" }}
          >
{`NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`}
          </pre>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={reload}>
              <RefreshCw size={14} aria-hidden="true" />
              Retry
            </Button>
            <Link href="/" className="app-btn app-btn-secondary">
              Back to the site
            </Link>
          </div>
          <p
            className="mt-4 flex items-start gap-2 text-[11px] leading-5"
            style={{ color: "var(--app-muted)" }}
          >
            <LockKeyhole size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
            Never put a service-role or secret key in a public environment variable.
          </p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="app-theme flex min-h-dvh items-center justify-center px-4 py-12">
        <div className="app-card w-full max-w-[520px] p-6 text-center">
          <span
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: "var(--app-terracotta-soft)", color: "var(--app-terracotta)" }}
          >
            <AlertCircle size={18} aria-hidden="true" />
          </span>
          <h1 className="mt-3 font-heading text-[24px]">Workspace unavailable</h1>
          <p className="mt-2 text-[12.5px] leading-5" style={{ color: "var(--app-muted)" }}>
            {state.message}
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <Button type="button" onClick={reload}>
              <RefreshCw size={14} aria-hidden="true" />
              Try again
            </Button>
            <Link href="/login" className="app-btn app-btn-secondary">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WorkspaceProvider initialData={state.data}>
      <AppShell>{children}</AppShell>
    </WorkspaceProvider>
  );
}
