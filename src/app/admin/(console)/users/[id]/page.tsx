import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdminSession } from "@/lib/admin/auth";
import { formatDateTime, formatNumber, shortId } from "@/lib/admin/format";
import type { AdminUserDetail } from "@/lib/admin/types";
import {
  DetailRow,
  EmptyRow,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "User detail" };

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireAdminSession();

  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { data, error } = await supabase.rpc("admin_user_detail", { p_user_id: id });
  if (error?.code === "P0002" || (!error && !data)) notFound();

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Directory" title="User detail" />
        <p className="admin-card p-4 text-[12.5px] text-[var(--adm-red)]">
          This account could not be loaded: {error.message}
        </p>
      </>
    );
  }

  const detail = data as AdminUserDetail;
  const { user, counts } = detail;

  return (
    <>
      <Link href="/admin/users" className="mb-3 inline-flex items-center gap-1.5 text-[11.5px] text-[var(--adm-muted)] hover:text-[var(--adm-ink)]">
        <ArrowLeft size={12} aria-hidden="true" />
        Back to users
      </Link>

      <PageHeader
        eyebrow="Account metadata"
        title={user.fullName || user.email || "Unnamed account"}
        description="Administrative metadata and activity. Private documents, meetings and message contents are never accessible from this console."
        actions={
          <span className="admin-badge admin-badge-neutral admin-mono">{shortId(user.id)}</span>
        }
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Identity" className="lg:col-span-2">
          <dl>
            <DetailRow label="User ID">
              <span className="admin-mono">{user.id}</span>
            </DetailRow>
            <DetailRow label="Email">{user.email ?? "—"}</DetailRow>
            <DetailRow label="Username">{user.username ? `@${user.username}` : "—"}</DetailRow>
            <DetailRow label="Display name">{user.fullName || "—"}</DetailRow>
            <DetailRow label="Workspace role">{user.role}</DetailRow>
            <DetailRow label="Registered">{formatDateTime(user.createdAt)}</DetailRow>
            <DetailRow label="Email verified">{formatDateTime(user.emailConfirmedAt)}</DetailRow>
            <DetailRow label="Last sign-in">{formatDateTime(user.lastSignInAt)}</DetailRow>
            <DetailRow label="Last seen in app">{formatDateTime(user.lastSeenAt)}</DetailRow>
            <DetailRow label="Sign-in providers">
              {user.providers.length ? user.providers.join(", ") : "—"}
            </DetailRow>
            <DetailRow label="Account status">
              <StatusBadge
                value={
                  user.bannedUntil && new Date(user.bannedUntil) > new Date()
                    ? "Suspended"
                    : user.emailConfirmedAt
                      ? "Active"
                      : "Pending verification"
                }
              />
            </DetailRow>
            <DetailRow label="Suspended until">
              {user.bannedUntil ? formatDateTime(user.bannedUntil) : "—"}
            </DetailRow>
          </dl>
        </Panel>

        <Panel title="Workspace footprint">
          <dl>
            <DetailRow label="Projects">{formatNumber(counts.projects)}</DetailRow>
            <DetailRow label="Documents">{formatNumber(counts.documents)}</DetailRow>
            <DetailRow label="Meetings">{formatNumber(counts.meetings)}</DetailRow>
            <DetailRow label="Decisions">{formatNumber(counts.decisions)}</DetailRow>
            <DetailRow label="Action items">{formatNumber(counts.actionItems)}</DetailRow>
            <DetailRow label="Knowledge entries">{formatNumber(counts.knowledgeEntries)}</DetailRow>
            <DetailRow label="Successful logins">{formatNumber(counts.logins)}</DetailRow>
            <DetailRow label="Failed logins">{formatNumber(counts.failedLogins)}</DetailRow>
          </dl>
          <p className="mt-3 text-[11px] leading-4 text-[var(--adm-muted)]">
            Counts only. The console never reads document text, meeting notes or message
            bodies.
          </p>
        </Panel>
      </div>

      <div className="mt-3">
        <Panel
          title="Recent authentication activity"
          description="Last 25 events for this account."
          actions={
            <Link href={`/admin/login-activity?userId=${user.id}`} className="admin-link text-[11.5px]">
              Filter activity
            </Link>
          }
          padded={false}
        >
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Result</th>
                  <th>Reason</th>
                  <th>Device</th>
                  <th>Correlation</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {detail.recentEvents.length === 0 ? (
                  <EmptyRow colSpan={6} message="No authentication events recorded for this account." />
                ) : (
                  detail.recentEvents.map((event) => (
                    <tr key={event.id}>
                      <td className="text-[12px]">{event.eventType.replace(/_/g, " ")}</td>
                      <td>
                        <StatusBadge value={event.success ? "success" : "error"} />
                      </td>
                      <td className="max-w-[160px] truncate text-[11.5px] text-[var(--adm-muted)]">
                        {event.reason ?? "—"}
                      </td>
                      <td className="max-w-[180px] truncate text-[11px] text-[var(--adm-muted)]" title={event.userAgent}>
                        {event.userAgent || "Unknown"}
                      </td>
                      <td className="admin-mono text-[var(--adm-muted)]">
                        {event.correlationId ? shortId(event.correlationId) : "—"}
                      </td>
                      <td className="whitespace-nowrap text-[11px]">{formatDateTime(event.createdAt)}</td>
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
