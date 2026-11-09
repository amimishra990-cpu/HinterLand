import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { requireAdminSession } from "@/lib/admin/auth";
import { formatDateTime, formatNumber, shortId } from "@/lib/admin/format";
import type { AuditRow } from "@/lib/admin/types";
import {
  EmptyRow,
  Notice,
  PageHeader,
  Pagination,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Audit Logs" };

const PAGE_SIZE = 25;
const ACTIONS = [
  "admin.login",
  "admin.password_changed",
  "admin.bootstrap",
  "admin.bootstrap_finalized",
  "admin.view_user",
  "admin.view_issue",
  "admin.issue_status",
  "admin.setting_changed",
  "admin.retention_run",
];

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

export default async function AdminAuditPage({
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
    action: value("action"),
    from: value("from"),
    to: value("to"),
  };

  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase.rpc("admin_list_audit", {
    p_search: query.q || null,
    p_action: query.action || null,
    p_from: toStart(query.from),
    p_to: toEnd(query.to),
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  const rows = (data ?? []) as AuditRow[];
  const total = rows[0]?.total_count ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Accountability"
        title="Audit Logs"
        description="Administrator sign-ins, sensitive record views, issue status changes, setting changes and retention runs. Entries are written only by security-definer functions; administrators cannot edit or delete them."
        actions={
          <span className="text-[11.5px] text-[var(--adm-muted)]">
            {formatNumber(total)} entr{total === 1 ? "y" : "ies"}
          </span>
        }
      />

      <form
        method="get"
        action="/admin/audit"
        className="admin-card mb-3 grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="audit-search" className="admin-label">
            Search
          </label>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--adm-muted)]"
              aria-hidden="true"
            />
            <input
              id="audit-search"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Actor, action or target"
              className="admin-input pl-8"
            />
          </div>
        </div>
        <div>
          <label htmlFor="audit-action" className="admin-label">
            Action
          </label>
          <select id="audit-action" name="action" defaultValue={query.action ?? ""} className="admin-select">
            <option value="">All actions</option>
            {ACTIONS.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="audit-from" className="admin-label">
            From
          </label>
          <input id="audit-from" name="from" type="date" defaultValue={query.from ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="audit-to" className="admin-label">
            To
          </label>
          <input id="audit-to" name="to" type="date" defaultValue={query.to ?? ""} className="admin-input" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="admin-btn admin-btn-primary w-full">
            Apply
          </button>
        </div>
      </form>

      {error ? <Notice>The audit log could not be queried: {error.message}</Notice> : null}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Actor</th>
                <th>Action</th>
                <th>Target</th>
                <th>Metadata</th>
                <th>Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow colSpan={5} message={error ? "No data available." : "No audit entries match these filters."} />
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="max-w-[200px]">
                      <span className="block truncate text-[12px]">{row.actor_email || "system"}</span>
                      <span className="mt-0.5 block admin-mono text-[var(--adm-muted)]">
                        {row.actor_id ? shortId(row.actor_id) : "—"}
                      </span>
                    </td>
                    <td className="admin-mono text-[11.5px]">{row.action}</td>
                    <td className="text-[11.5px]">
                      {row.target_type ?? "—"}
                      {row.target_id ? (
                        row.target_type === "user" ? (
                          <Link href={`/admin/users/${row.target_id}`} className="admin-link mt-0.5 block admin-mono">
                            {shortId(row.target_id)}
                          </Link>
                        ) : (
                          <span className="mt-0.5 block admin-mono text-[var(--adm-muted)]">
                            {shortId(row.target_id)}
                          </span>
                        )
                      ) : null}
                    </td>
                    <td className="max-w-[260px]">
                      <span
                        className="admin-mono block truncate text-[10.5px] text-[var(--adm-muted)]"
                        title={JSON.stringify(row.metadata)}
                      >
                        {row.metadata && Object.keys(row.metadata).length > 0
                          ? JSON.stringify(row.metadata)
                          : "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap text-[11px]">{formatDateTime(row.created_at)}</td>
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
          basePath="/admin/audit"
          query={query}
        />
      </div>
    </>
  );
}
