"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import type { AdminSettings } from "@/lib/admin/types";

const FIELDS: Array<{
  key: keyof AdminSettings;
  label: string;
  hint: string;
  min: number;
  max: number;
}> = [
  {
    key: "monitoring_retention_days",
    label: "Authentication event retention (days)",
    hint: "7–365 days. Events older than this are removed by a retention run.",
    min: 7,
    max: 365,
  },
  {
    key: "issue_retention_days",
    label: "Resolved issue retention (days)",
    hint: "7–730 days. Only resolved or ignored groups are purged.",
    min: 7,
    max: 730,
  },
  {
    key: "failed_login_alert_threshold",
    label: "Failed-login alert threshold",
    hint: "1–1000. The overview highlights failed logins above this hourly threshold.",
    min: 1,
    max: 1000,
  },
];

export function SettingsForm({ settings }: { settings: AdminSettings }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({
    monitoring_retention_days: String(settings.monitoring_retention_days ?? 90),
    issue_retention_days: String(settings.issue_retention_days ?? 180),
    failed_login_alert_threshold: String(settings.failed_login_alert_threshold ?? 10),
  });
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  async function save() {
    setPending(true);
    setMessage(null);
    try {
      for (const field of FIELDS) {
        const raw = values[field.key] ?? "";
        const numeric = Number(raw);
        if (!Number.isInteger(numeric) || numeric < field.min || numeric > field.max) {
          setMessage({
            tone: "error",
            text: `${field.label} must be a whole number between ${field.min} and ${field.max}.`,
          });
          return;
        }
        const response = await fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key: field.key, value: numeric }),
        });
        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          setMessage({ tone: "error", text: payload?.error ?? "The settings could not be saved." });
          return;
        }
      }
      setMessage({ tone: "ok", text: "Settings saved. Every change is recorded in the audit log." });
      router.refresh();
    } catch {
      setMessage({ tone: "error", text: "The settings could not be saved. Check your connection." });
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      className="space-y-3.5"
    >
      {FIELDS.map((field) => (
        <div key={field.key}>
          <label htmlFor={`setting-${field.key}`} className="admin-label">
            {field.label}
          </label>
          <input
            id={`setting-${field.key}`}
            type="number"
            inputMode="numeric"
            min={field.min}
            max={field.max}
            step={1}
            value={values[field.key] ?? ""}
            onChange={(event) =>
              setValues((current) => ({ ...current, [field.key]: event.target.value }))
            }
            className="admin-input w-[140px]"
          />
          <p className="mt-1 text-[11px] text-[var(--adm-muted)]">{field.hint}</p>
        </div>
      ))}

      {message ? (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className="rounded-md px-3 py-2 text-[12px]"
          style={
            message.tone === "error"
              ? { backgroundColor: "var(--adm-red-soft)", color: "var(--adm-red)" }
              : { backgroundColor: "var(--adm-sage-soft)", color: "#2c4a39" }
          }
        >
          {message.text}
        </p>
      ) : null}

      <button type="submit" className="admin-btn admin-btn-primary" disabled={pending}>
        {pending ? <span className="admin-spinner" aria-label="Saving" /> : null}
        {pending ? "Saving" : "Save settings"}
      </button>
    </form>
  );
}

export function RetentionButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function run() {
    if (
      !window.confirm(
        "Run retention now? Authentication events, resolved issues and audit entries older than the configured windows will be permanently deleted. Workspace data is not touched."
      )
    ) {
      return;
    }
    setPending(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/retention", { method: "POST" });
      const payload = (await response.json().catch(() => null)) as
        | { authEventsDeleted?: number; issuesDeleted?: number; auditDeleted?: number; error?: string }
        | null;
      if (!response.ok) {
        setResult(payload?.error ?? "The retention run failed.");
        return;
      }
      setResult(
        `Removed ${payload?.authEventsDeleted ?? 0} auth events, ${payload?.issuesDeleted ?? 0} resolved issue groups and ${payload?.auditDeleted ?? 0} audit entries.`
      );
      router.refresh();
    } catch {
      setResult("The retention run failed. Check your connection.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void run()}
        className="admin-btn admin-btn-secondary"
        disabled={pending}
      >
        {pending ? <span className="admin-spinner" aria-label="Running retention" /> : null}
        {pending ? "Running retention" : "Run retention now"}
      </button>
      {result ? (
        <p className="mt-1.5 text-[11px] text-[var(--adm-muted)]" role="status">
          {result}
        </p>
      ) : null}
    </div>
  );
}
