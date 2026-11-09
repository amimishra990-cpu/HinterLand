"use client";

import { useEffect } from "react";

import { reportClientError } from "@/components/app/error-reporter";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      message: error.message || "Application error",
      severity: "error",
      metadata: { kind: "error_boundary", digest: error.digest ?? "" },
    });
  }, [error]);

  return (
    <div className="flex min-h-[60dvh] items-center justify-center px-4 py-16">
      <div className="max-w-[460px] text-center">
        <p className="eyebrow">Something went wrong</p>
        <h1 className="mt-2 font-heading text-[30px] leading-tight">
          This page could not be completed
        </h1>
        <p className="mt-2 text-[13px] leading-6 text-[var(--text-secondary)]">
          The failure was recorded for the administrator with a sanitized message. Your saved
          work is unaffected.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[11px] text-[var(--muted-foreground)]">
            Reference {error.digest}
          </p>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[4px] bg-[var(--color-forest)] px-4 text-[13px] font-semibold text-[var(--color-ivory)]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
