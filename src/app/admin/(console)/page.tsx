import type { Metadata } from "next";
import Link from "next/link";

import { requireAdminSession } from "@/lib/admin/auth";
import { runHealthChecks } from "@/lib/admin/health";
import {
  formatBytes,
  formatDateTime,
  formatNumber,
  formatRelative,
  shortId,
} from "@/lib/admin/format";
import type { AdminOverview } from "@/lib/admin/types";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import { TrendChart } from "@/components/admin/trend-chart";
import {
  DetailRow,
  EmptyRow,
  Notice,
  PageHeader,
  Panel,
  Stat,
  StatusBadge,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Overview" };

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdminSession();

  const [overviewResult, health] = await Promise.all([
    supabase.rpc("admin_overview"),
    runHealthChecks(supabase),
  ]);

  if (overviewResult.error) {
    return (
      <>
        <PageHeader
          eyebrow="Operations"
          title="Overview"
          description="Live platform totals, authentication activity and unresolved issues."
        />
        <Notice>The overview could not be loaded: {overviewResult.error.message}</Notice>
      </>
    );
  }

  const overview = overviewResult.data as AdminOverview;
  const healthById = new Map(health.map((check) => [check.id, check]));
  const platformChecks = ["website", "api", "database", "ai"].map((id) => healthById.get(id)!);

  return (
    <>
      <PageHeader
        eyebrow="Operations"
        title="Overview"
        description="Production figures only. Every number is computed from the live database at request time."
        actions={<AutoRefresh intervalSeconds={60} />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Total users"
          value={formatNumber(overview.totalUsers)}
          hint={`${formatNumber(overview.confirmedUsers)} verified email`}
        />
        <Stat
          label="New today"
          value={formatNumber(overview.newToday)}
          hint={`${formatNumber(overview.newWeek)} this week · ${formatNumber(overview.newMonth)} this month`}
          tone="forest"
        />
        <Stat
          label="Active (30 days)"
          value={formatNumber(overview.activeUsers30d)}
          hint="Distinct accounts with a session in the window"
        />
        <Stat
          label="Logins today"
          value={formatNumber(overview.loginsToday)}
          hint={`${formatNumber(overview.logins7d)} in the last 7 days`}
          tone="forest"
        />
        <Stat
          label="Failed logins today"
          value={formatNumber(overview.failedToday)}
          hint={`${formatNumber(overview.failedLastHour)} in the last hour · ${formatNumber(overview.failed7d)} in 7 days`}
          tone={overview.failedLastHour > 10 ? "red" : overview.failedToday > 0 ? "terracotta" : "neutral"}
        />
        <Stat
          label="Open issues"
          value={formatNumber(overview.openIssues)}
          hint={`${formatNumber(overview.resolved7d)} resolved in the last 7 days`}
          tone={overview.criticalOpenIssues > 0 ? "red" : overview.openIssues > 0 ? "terracotta" : "forest"}
        />
        <Stat
          label="Critical unresolved"
          value={formatNumber(overview.criticalOpenIssues)}
          hint={`${formatNumber(overview.warningOpenIssues)} warning severity open`}
          tone={overview.criticalOpenIssues > 0 ? "red" : "forest"}
        />
        <Stat
          label="Database size"
          value={formatBytes(overview.database.sizeBytes)}
          hint={`${formatNumber(overview.database.connections)} active connections`}
          tone="navy"
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="Registrations" description="Accounts created per day, last 30 days.">
          <TrendChart points={overview.signupSeries} label="New registrations" tone="forest" />
        </Panel>
        <Panel title="Authentication" description="Successful and failed sign-ins, last 14 days.">
          <div className="grid gap-4 sm:grid-cols-2">
            <TrendChart points={overview.loginSeries} label="Successful logins" tone="forest" height={96} />
            <TrendChart points={overview.failedSeries} label="Failed logins" tone="terracotta" height={96} />
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel
          title="Platform health"
          description="Last checked when this page rendered."
          actions={
            <Link href="/admin/health" className="admin-link text-[11.5px]">
              Full report
            </Link>
          }
          className="lg:col-span-1"
        >
          <ul className="space-y-2.5">
            {platformChecks.map((check) => (
              <li key={check.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-medium">{check.label}</p>
                  <p className="mt-0.5 text-[11px] leading-4 text-[var(--adm-muted)]">
                    {check.detail}
                  </p>
                </div>
                <StatusBadge value={check.status.replace("_", " ")} />
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-[var(--adm-line)] pt-3">
            <DetailRow label="AI provider last run">
              {overview.aiLastRun
                ? `${overview.aiLastRun.status ?? "unknown"} · ${formatRelative(overview.aiLastRun.created_at)}`
                : "No AI run recorded"}
            </DetailRow>
            <DetailRow label="Model">
              {overview.aiLastRun?.model ?? "Not selected"}
            </DetailRow>
            <DetailRow label="Snapshot generated">
              {formatDateTime(overview.generatedAt)}
            </DetailRow>
          </div>
        </Panel>

        <Panel
          title="Unresolved issues"
          description="Grouped by fingerprint, newest first."
          actions={
            <Link href="/admin/issues" className="admin-link text-[11.5px]">
              All issues
            </Link>
          }
          className="lg:col-span-2"
          padded={false}
        >
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Issue</th>
                  <th>Status</th>
                  <th>Seen</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentIssues.length === 0 ? (
                  <EmptyRow colSpan={4} message="No errors or warnings have been recorded." />
                ) : (
                  overview.recentIssues.map((issue) => (
                    <tr key={issue.id}>
                      <td>
                        <StatusBadge value={issue.severity} />
                      </td>
                      <td className="max-w-[340px]">
                        <Link
                          href={`/admin/issues/${issue.id}`}
                          className="admin-link block truncate text-[12px]"
                          title={issue.message}
                        >
                          {issue.message}
                        </Link>
                        <span className="mt-0.5 block text-[10.5px] text-[var(--adm-muted)]">
                          {issue.category}
                          {issue.route ? ` · ${issue.route}` : ""} · {issue.occurrenceCount}×
                        </span>
                      </td>
                      <td>
                        <StatusBadge value={issue.status} />
                      </td>
                      <td className="whitespace-nowrap text-[11px] text-[var(--adm-muted)]">
                        {formatRelative(issue.lastSeenAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-2">
        <Panel title="Recent registrations" actions={<Link href="/admin/users" className="admin-link text-[11.5px]">All users</Link>} padded={false}>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Verified</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentUsers.length === 0 ? (
                  <EmptyRow colSpan={3} message="No user accounts exist yet." />
                ) : (
                  overview.recentUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <Link href={`/admin/users/${user.id}`} className="admin-link text-[12px]">
                          {user.fullName || user.email || shortId(user.id)}
                        </Link>
                        <span className="mt-0.5 block text-[10.5px] text-[var(--adm-muted)]">
                          {user.email ?? "no email on record"}
                        </span>
                      </td>
                      <td>
                        <StatusBadge value={user.confirmed ? "Verified" : "Pending"} />
                      </td>
                      <td className="whitespace-nowrap text-[11px] text-[var(--adm-muted)]">
                        {formatRelative(user.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        <Panel title="Latest authentication events" actions={<Link href="/admin/login-activity" className="admin-link text-[11.5px]">All activity</Link>} padded={false}>
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Account</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentEvents.length === 0 ? (
                  <EmptyRow colSpan={3} message="No authentication events recorded yet." />
                ) : (
                  overview.recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <span className="text-[12px]">{event.eventType.replace(/_/g, " ")}</span>
                        <span className="ml-1.5">
                          <StatusBadge value={event.success ? "success" : "error"} />
                        </span>
                      </td>
                      <td className="max-w-[180px] truncate text-[11.5px]">
                        {event.email || "—"}
                      </td>
                      <td className="whitespace-nowrap text-[11px] text-[var(--adm-muted)]">
                        {formatRelative(event.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </>
  );
}
