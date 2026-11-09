import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAdminSession } from "@/lib/admin/auth";
import { formatDateTime, formatNumber, shortId } from "@/lib/admin/format";
import type { IssueDetail } from "@/lib/admin/types";
import { IssueStatusControl } from "@/components/admin/issue-status-control";
import {
  DetailRow,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Issue detail" };

export default async function AdminIssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const { supabase } = await requireAdminSession();
  const { data, error } = await supabase.rpc("admin_get_issue", { p_issue_id: id });
  if (error?.code === "P0002" || (!error && !data)) notFound();

  if (error) {
    return (
      <>
        <PageHeader eyebrow="Monitoring" title="Issue detail" />
        <p className="admin-card p-4 text-[12.5px] text-[var(--adm-red)]">
          This issue could not be loaded: {error.message}
        </p>
      </>
    );
  }

  const issue = data as IssueDetail;
  const metadata = issue.metadata && Object.keys(issue.metadata).length > 0 ? issue.metadata : null;

  return (
    <>
      <Link
        href="/admin/issues"
        className="mb-3 inline-flex items-center gap-1.5 text-[11.5px] text-[var(--adm-muted)] hover:text-[var(--adm-ink)]"
      >
        <ArrowLeft size={12} aria-hidden="true" />
        Back to issues
      </Link>

      <PageHeader
        eyebrow="Issue group"
        title={issue.category}
        description={`Grouped by fingerprint ${shortId(issue.fingerprint)}. Occurrence count ${formatNumber(issue.occurrence_count)}.`}
        actions={<IssueStatusControl issueId={issue.id} current={issue.status} />}
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="Sanitized message" className="lg:col-span-2">
          <pre className="overflow-x-auto rounded border border-[var(--adm-line)] bg-[var(--adm-panel-soft)] p-3 font-mono text-[11.5px] leading-5 whitespace-pre-wrap break-words">
            {issue.message}
          </pre>
          {metadata ? (
            <>
              <p className="admin-label mt-4">Sanitized metadata</p>
              <pre className="overflow-x-auto rounded border border-[var(--adm-line)] bg-[var(--adm-panel-soft)] p-3 font-mono text-[11px] leading-5">
                {JSON.stringify(metadata, null, 2)}
              </pre>
            </>
          ) : (
            <p className="mt-3 text-[11.5px] text-[var(--adm-muted)]">
              No additional metadata was recorded.
            </p>
          )}
        </Panel>

        <Panel title="Classification">
          <dl>
            <DetailRow label="Severity">
              <StatusBadge value={issue.severity} />
            </DetailRow>
            <DetailRow label="Status">
              <StatusBadge value={issue.status} />
            </DetailRow>
            <DetailRow label="Category">{issue.category}</DetailRow>
            <DetailRow label="Route">{issue.route ?? "—"}</DetailRow>
            <DetailRow label="Environment">{issue.environment}</DetailRow>
            <DetailRow label="App version">{issue.app_version ?? "—"}</DetailRow>
            <DetailRow label="Correlation">
              <span className="admin-mono">{issue.correlation_id ?? "—"}</span>
            </DetailRow>
            <DetailRow label="Fingerprint">
              <span className="admin-mono">{issue.fingerprint}</span>
            </DetailRow>
            <DetailRow label="First seen">{formatDateTime(issue.first_seen_at)}</DetailRow>
            <DetailRow label="Last seen">{formatDateTime(issue.last_seen_at)}</DetailRow>
            <DetailRow label="Occurrences">{formatNumber(issue.occurrence_count)}</DetailRow>
            <DetailRow label="Resolved">
              {issue.resolved_at
                ? `${formatDateTime(issue.resolved_at)}${issue.resolved_by ? ` · ${shortId(issue.resolved_by)}` : ""}`
                : "—"}
            </DetailRow>
          </dl>
        </Panel>
      </div>

      <p className="mt-3 text-[11px] leading-4 text-[var(--adm-muted)]">
        Messages, routes and metadata pass through server-side redaction before storage.
        Emails, bearer tokens, API keys and JWTs are replaced with placeholders. Status changes
        are recorded in the audit log.
      </p>
    </>
  );
}
