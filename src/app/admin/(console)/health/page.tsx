import type { Metadata } from "next";

import { requireAdminSession } from "@/lib/admin/auth";
import { runHealthChecks } from "@/lib/admin/health";
import { formatDateTime, formatNumber } from "@/lib/admin/format";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { PageHeader, Panel, Stat, StatusBadge } from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "System Health" };

const LABELS: Record<string, string> = {
  operational: "Operational",
  degraded: "Degraded",
  unavailable: "Unavailable",
  not_configured: "Not configured",
  unknown: "Unknown",
};

export default async function AdminHealthPage() {
  const { supabase } = await requireAdminSession();
  const checks = await runHealthChecks(supabase);

  const count = (status: string) => checks.filter((check) => check.status === status).length;
  const checkedAt = checks[0]?.checkedAt ?? new Date().toISOString();

  return (
    <>
      <PageHeader
        eyebrow="Reliability"
        title="System Health"
        description="Every result below comes from a live request made while rendering this page. A configured environment variable alone never marks a dependency as healthy."
        actions={<AutoRefresh intervalSeconds={90} label="Checks re-run on refresh" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Operational" value={formatNumber(count("operational"))} tone="forest" hint="Live checks passed" />
        <Stat label="Degraded" value={formatNumber(count("degraded"))} tone="gold" hint="Responding with reduced capability" />
        <Stat label="Unavailable" value={formatNumber(count("unavailable"))} tone="red" hint="Live check failed" />
        <Stat
          label="Not configured"
          value={formatNumber(count("not_configured"))}
          tone="navy"
          hint="No credentials or worker exists"
        />
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {checks.map((check) => (
          <Panel
            key={check.id}
            title={check.label}
            actions={<StatusBadge value={LABELS[check.status] ?? check.status} />}
          >
            <p className="min-h-[42px] text-[12px] leading-5 text-[var(--adm-ink-soft)]">
              {check.detail}
            </p>
            <div className="mt-2.5 flex items-center justify-between border-t border-[var(--adm-line)] pt-2 text-[10.5px] text-[var(--adm-muted)]">
              <span>{check.latencyMs === null ? "Cached reading" : `${formatNumber(check.latencyMs)} ms`}</span>
              <span>{formatDateTime(check.checkedAt)}</span>
            </div>
          </Panel>
        ))}
      </div>

      <div className="admin-card mt-3 p-4">
        <p className="text-[11.5px] leading-5 text-[var(--adm-muted)]">
          <span className="font-medium text-[var(--adm-ink-soft)]">Reading these results:</span>{" "}
          <em>Operational</em> means the dependency completed a real request. <em>Degraded</em> means
          it answered but reported a problem or failed a stricter probe. <em>Unavailable</em> means
          the probe failed or credentials were rejected. <em>Not configured</em> is expected where
          the platform has no component — this console does not fabricate a green status. Checks
          ran at {formatDateTime(checkedAt)} and never expose secrets.
        </p>
      </div>
    </>
  );
}
