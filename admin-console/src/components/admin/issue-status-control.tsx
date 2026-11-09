"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const OPTIONS = [
  { value: "open", label: "Open" },
  { value: "investigating", label: "Investigating" },
  { value: "resolved", label: "Resolved" },
  { value: "ignored", label: "Ignored" },
];

export function IssueStatusControl({
  issueId,
  current,
}: {
  issueId: string;
  current: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(current);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(next: string) {
    if (next === status || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/issues/${issueId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(payload?.error ?? "The issue could not be updated.");
        return;
      }
      setStatus(next);
      router.refresh();
    } catch {
      setError("The issue could not be updated. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Issue status">
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={pending}
            onClick={() => void update(option.value)}
            aria-pressed={status === option.value}
            className={
              status === option.value
                ? "admin-btn admin-btn-primary admin-btn-sm"
                : "admin-btn admin-btn-secondary admin-btn-sm"
            }
          >
            {option.label}
          </button>
        ))}
        {pending ? <span className="admin-spinner self-center" aria-label="Saving status" /> : null}
      </div>
      {error ? (
        <p className="mt-1.5 text-[11px] text-[var(--adm-red)]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
