import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { requireAdminSession } from "@/lib/admin/auth";
import { formatDateTime, formatNumber, shortId } from "@/lib/admin/format";
import { deviceCategory } from "@/lib/admin/telemetry";
import type { AuthEventListRow } from "@/lib/admin/types";
import {
  EmptyRow,
  Notice,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Login Activity" };

const PAGE_SIZE = 25;
const EVENT_TYPES = [
  "login",
  "login_failed",
  "logout",
  "signup",
  "password_recovery_requested",
  "password_updated",
  "email_verified",
  "session_expired",
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

export default async function AdminLoginActivityPage({
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
    type: value("type"),
    result: value("result"),
    from: value("from"),
    to: value("to"),
    userId: value("userId"),
  };
  const success =
    query.result === "success" ? true : query.result === "failure" ? false : null;
  const userId = query.userId && /^[0-9a-f-]{36}$/i.test(query.userId) ? query.userId : null;

  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase.rpc("admin_list_auth_events", {
    p_search: query.q || null,
    p_event_type: query.type || null,
    p_success: success,
    p_from: toStart(query.from),
    p_to: toEnd(query.to),
    p_user_id: userId,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  const rows = (data ?? []) as AuthEventListRow[];
  const total = rows[0]?.total_count ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Security"
        title="Login Activity"
        description="Events are written by trusted server-side code and database triggers. Users cannot create, edit or delete their own authentication records. Full IP addresses and any tokens are never stored."
        actions={
          <span className="text-[11.5px] text-[var(--adm-muted)]">
            {formatNumber(total)} event{total === 1 ? "" : "s"}
          </span>
        }
      />

      <form
        method="get"
        action="/admin/login-activity"
        className="admin-card mb-3 grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
      >
        {userId ? <input type="hidden" name="userId" value={userId} /> : null}
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="event-search" className="admin-label">
            Search
          </label>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--adm-muted)]"
              aria-hidden="true"
            />
            <input
              id="event-search"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Email, user ID, reason"
              className="admin-input pl-8"
            />
          </div>
        </div>
        <div>
          <label htmlFor="event-type" className="admin-label">
            Event
          </label>
          <select id="event-type" name="type" defaultValue={query.type ?? ""} className="admin-select">
            <option value="">All events</option>
            {EVENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="event-result" className="admin-label">
            Result
          </label>
          <select id="event-result" name="result" defaultValue={query.result ?? ""} className="admin-select">
            <option value="">Any result</option>
            <option value="success">Successful</option>
            <option value="failure">Failed</option>
          </select>
        </div>
        <div>
          <label htmlFor="event-from" className="admin-label">
            From
          </label>
          <input id="event-from" name="from" type="date" defaultValue={query.from ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="event-to" className="admin-label">
            To
          </label>
          <input id="event-to" name="to" type="date" defaultValue={query.to ?? ""} className="admin-input" />
        </div>
        <div className="flex items-end">
          <button type="submit" className="admin-btn admin-btn-primary w-full">
            Apply
          </button>
        </div>
      </form>

      {userId ? (
        <p className="mb-2 text-[11.5px] text-[var(--adm-muted)]">
          Filtered to one account.{" "}
          <Link href="/admin/login-activity" className="admin-link">
            Clear
          </Link>
        </p>
      ) : null}

      {error ? <Notice>The activity log could not be queried: {error.message}</Notice> : null}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Result</th>
                <th>Account</th>
                <th>Device</th>
                <th>Reason</th>
                <th>Correlation</th>
                <th>Timestamp (UTC)</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow
                  colSpan={7}
                  message={error ? "No data available." : "No authentication events match these filters."}
                />
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap text-[12px]">
                      {row.event_type.replace(/_/g, " ")}
                    </td>
                    <td>
                      <StatusBadge value={row.success ? "success" : "error"} />
                    </td>
                    <td className="max-w-[210px]">
                      {row.user_id ? (
                        <Link href={`/admin/users/${row.user_id}`} className="admin-link block truncate text-[11.5px]">
                          {row.email || shortId(row.user_id)}
                        </Link>
                      ) : (
                        <span className="block truncate text-[11.5px]">{row.email || "—"}</span>
                      )}
                      <span className="mt-0.5 block admin-mono text-[var(--adm-muted)]">
                        {shortId(row.id)}
                      </span>
                    </td>
                    <td className="text-[11.5px] text-[var(--adm-muted)]">
                      {deviceCategory(row.user_agent) || "Unknown"}
                    </td>
                    <td className="max-w-[180px] truncate text-[11.5px] text-[var(--adm-muted)]" title={row.reason ?? undefined}>
                      {row.reason ?? "—"}
                    </td>
                    <td className="admin-mono text-[var(--adm-muted)]">
                      {row.correlation_id ? shortId(row.correlation_id) : "—"}
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
          basePath="/admin/login-activity"
          query={query}
        />
      </div>

      <p className="mt-3 text-[11px] leading-4 text-[var(--adm-muted)]">
        Successful logins are derived from verified server sessions. Failed logins and recovery
        requests are rate-limited at the database. Passwords, reset tokens, access tokens and
        refresh tokens are never written to this table.
      </p>
    </>
  );
}
