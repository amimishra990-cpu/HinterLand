import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { requireAdminSession } from "@/lib/admin/auth";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/admin/format";
import type { IssueRow } from "@/lib/admin/types";
import {
  EmptyRow,
  Notice,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Website Issues" };

const PAGE_SIZE = 25;

function toStart(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toEnd(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default async function AdminIssuesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const value = (key: string) => {
    const raw = params[key];
    return typeof raw === "string" ? raw : undefined;
  };

  const page = Math.max(1, Number.parseInt(value("page") ?? "1", 10) || 1);
  const query = {
    q: value("q"),
    severity: value("severity"),
    status: value("status"),
    from: value("from"),
    to: value("to"),
  };

  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase.rpc("admin_list_issues", {
    p_search: query.q || null,
    p_severity: query.severity || null,
    p_status: query.status || null,
    p_from: toStart(query.from),
    p_to: toEnd(query.to),
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  const rows = (data ?? []) as IssueRow[];
  const total = rows[0]?.total_count ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Monitoring"
        title="Website Issues"
        description="Unhandled client errors, failed API requests, server exceptions and pipeline failures. Repeated failures are grouped by fingerprint. Messages are sanitized before storage."
        actions={
          <span className="text-[11.5px] text-[var(--adm-muted)]">
            {formatNumber(total)} group{total === 1 ? "" : "s"}
          </span>
        }
      />

      <form
        method="get"
        action="/admin/issues"
        className="admin-card mb-3 grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="issue-search" className="admin-label">
            Search
          </label>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--adm-muted)]"
              aria-hidden="true"
            />
            <input
              id="issue-search"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Message, route or category"
              className="admin-input pl-8"
            />
          </div>
        </div>
        <div>
          <label htmlFor="issue-severity" className="admin-label">
            Severity
          </label>
          <select id="issue-severity" name="severity" defaultValue={query.severity ?? ""} className="admin-select">
            <option value="">All severities</option>
            <option value="critical">Critical</option>
            <option value="error">Error</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
        <div>
          <label htmlFor="issue-status" className="admin-label">
            Status
          </label>
          <select id="issue-status" name="status" defaultValue={query.status ?? ""} className="admin-select">
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>
        </div>
        <div>
          <label htmlFor="issue-from" className="admin-label">
            Last seen after
          </label>
          <input id="issue-from" name="from" type="date" defaultValue={query.from ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="issue-to" className="admin-label">
            Last seen before
          </label>
          <input id="issue-to" name="to" type="date" defaultValue={query.to ?? ""} className="admin-input" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="admin-btn admin-btn-primary w-full">
            Apply
          </button>
        </div>
      </form>

      {error ? <Notice>The issue register could not be queried: {error.message}</Notice> : null}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Severity</th>
                <th>Issue</th>
                <th>Status</th>
                <th>Count</th>
                <th>First seen</th>
                <th>Last seen</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow
                  colSpan={7}
                  message={error ? "No data available." : "No issues match these filters. The application has not reported an error in this window."}
                />
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <StatusBadge value={row.severity} />
                    </td>
                    <td className="max-w-[360px]">
                      <Link href={`/admin/issues/${row.id}`} className="admin-link block truncate text-[12px]" title={row.message}>
                        {row.message}
                      </Link>
                      <span className="mt-0.5 block text-[10.5px] text-[var(--adm-muted)]">
                        {row.category}
                        {row.route ? ` · ${row.route}` : ""} · {row.environment}
                        {row.app_version ? ` · ${row.app_version}` : ""}
                      </span>
                    </td>
                    <td>
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="tabular-nums text-[12px]">{formatNumber(row.occurrence_count)}</td>
                    <td className="whitespace-nowrap text-[11px]">{formatDateTime(row.first_seen_at)}</td>
                    <td className="whitespace-nowrap text-[11px]">
                      {formatRelative(row.last_seen_at)}
                    </td>
                    <td className="text-right">
                      <Link href={`/admin/issues/${row.id}`} className="admin-btn admin-btn-secondary admin-btn-sm">
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page}
          pageSize={PAGE_SIZE}
          total={total}
          basePath="/admin/issues"
          query={query}
        />
      </div>
    </>
  );
}
