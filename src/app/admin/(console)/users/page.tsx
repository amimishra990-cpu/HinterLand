import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";

import { requireAdminSession } from "@/lib/admin/auth";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/admin/format";
import type { AdminUserRow } from "@/lib/admin/types";
import {
  EmptyRow,
  Notice,
  PageHeader,
  Pagination,
  StatusBadge,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Users" };

const PAGE_SIZE = 25;
const SORTS = [
  { value: "created_at", label: "Registration date" },
  { value: "last_sign_in_at", label: "Last sign-in" },
  { value: "full_name", label: "Display name" },
  { value: "email", label: "Email" },
];

function toStart(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toEnd(value: string | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export default async function AdminUsersPage({
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
    status: value("status"),
    sort: value("sort") ?? "created_at",
    dir: value("dir") ?? "desc",
    from: value("from"),
    to: value("to"),
  };
  const sort = SORTS.some((option) => option.value === query.sort)
    ? query.sort
    : "created_at";
  const desc = query.dir !== "asc";

  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase.rpc("admin_list_users", {
    p_search: query.q || null,
    p_from: toStart(query.from),
    p_to: toEnd(query.to),
    p_status: query.status || null,
    p_sort: sort,
    p_desc: desc,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });

  const rows = (data ?? []) as AdminUserRow[];
  const total = rows[0]?.total_count ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Users"
        description="Account metadata only. Passwords, tokens and the contents of private documents or meetings are never available here."
        actions={
          <span className="text-[11.5px] text-[var(--adm-muted)]">
            {formatNumber(total)} account{total === 1 ? "" : "s"}
          </span>
        }
      />

      <form
        method="get"
        action="/admin/users"
        className="admin-card mb-3 grid gap-2.5 p-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]"
      >
        <div className="sm:col-span-2 lg:col-span-1">
          <label htmlFor="user-search" className="admin-label">
            Search
          </label>
          <div className="relative">
            <Search
              size={13}
              className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--adm-muted)]"
              aria-hidden="true"
            />
            <input
              id="user-search"
              name="q"
              defaultValue={query.q ?? ""}
              placeholder="Email, name, username or user ID"
              className="admin-input pl-8"
            />
          </div>
        </div>
        <div>
          <label htmlFor="user-status" className="admin-label">
            Status
          </label>
          <select id="user-status" name="status" defaultValue={query.status ?? ""} className="admin-select">
            <option value="">Any status</option>
            <option value="active">Active</option>
            <option value="pending">Pending verification</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
        <div>
          <label htmlFor="user-from" className="admin-label">
            Registered after
          </label>
          <input id="user-from" name="from" type="date" defaultValue={query.from ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="user-to" className="admin-label">
            Registered before
          </label>
          <input id="user-to" name="to" type="date" defaultValue={query.to ?? ""} className="admin-input" />
        </div>
        <div>
          <label htmlFor="user-sort" className="admin-label">
            Sort
          </label>
          <div className="flex gap-1.5">
            <select id="user-sort" name="sort" defaultValue={sort} className="admin-select">
              {SORTS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="dir"
              defaultValue={desc ? "desc" : "asc"}
              aria-label="Sort direction"
              className="admin-select w-[86px]"
            >
              <option value="desc">Newest</option>
              <option value="asc">Oldest</option>
            </select>
          </div>
        </div>
        <div className="flex items-end">
          <button type="submit" className="admin-btn admin-btn-primary w-full">
            Apply
          </button>
        </div>
      </form>

      {error ? <Notice>The user directory could not be queried: {error.message}</Notice> : null}

      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Status</th>
                <th>Registered</th>
                <th>Last sign-in</th>
                <th>Logins</th>
                <th>Workspace</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <EmptyRow
                  colSpan={7}
                  message={error ? "No data available." : "No accounts match these filters."}
                />
              ) : (
                rows.map((row) => (
                  <tr key={row.user_id}>
                    <td>
                      <Link href={`/admin/users/${row.user_id}`} className="admin-link text-[12.5px] font-medium">
                        {row.full_name || row.username || row.email || "Unnamed account"}
                      </Link>
                      <span className="mt-0.5 block text-[10.5px] text-[var(--adm-muted)]">
                        {row.email ?? "no email"}
                        {row.username ? ` · @${row.username}` : ""}
                      </span>
                    </td>
                    <td>
                      <StatusBadge value={row.status} />
                    </td>
                    <td className="whitespace-nowrap text-[11.5px]">
                      {formatDateTime(row.created_at)}
                    </td>
                    <td className="whitespace-nowrap text-[11.5px]">
                      {formatRelative(row.last_sign_in_at)}
                      <span className="mt-0.5 block text-[10.5px] text-[var(--adm-muted)]">
                        seen {formatRelative(row.last_seen_at)}
                      </span>
                    </td>
                    <td className="tabular-nums text-[12px]">{formatNumber(row.login_count)}</td>
                    <td className="text-[11.5px] text-[var(--adm-muted)]">
                      {row.project_count} projects · {row.document_count} docs · {row.meeting_count} meetings
                    </td>
                    <td className="text-right">
                      <Link
                        href={`/admin/users/${row.user_id}`}
                        className="admin-btn admin-btn-secondary admin-btn-sm"
                      >
                        Inspect
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
          basePath="/admin/users"
          query={query}
        />
      </div>
    </>
  );
}
