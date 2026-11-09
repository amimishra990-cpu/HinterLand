import type { Metadata } from "next";
import Link from "next/link";

import { requireAdminSession } from "@/lib/admin/auth";
import { formatBytes, formatDateTime, formatNumber } from "@/lib/admin/format";
import type { DatabaseOverview, DocumentPipeline } from "@/lib/admin/types";
import { AutoRefresh } from "@/components/admin/auto-refresh";
import {
  DetailRow,
  EmptyRow,
  Notice,
  PageHeader,
  Panel,
  Stat,
  StatusBadge,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Database Activity" };

export default async function AdminDatabasePage() {
  const { supabase } = await requireAdminSession();
  const [overviewResult, pipelineResult] = await Promise.all([
    supabase.rpc("admin_database_overview"),
    supabase.rpc("admin_document_pipeline"),
  ]);

  if (overviewResult.error) {
    return (
      <>
        <PageHeader eyebrow="Storage" title="Database Activity" />
        <Notice>The database overview could not be read: {overviewResult.error.message}</Notice>
      </>
    );
  }

  const overview = overviewResult.data as DatabaseOverview;
  const pipeline = (pipelineResult.data ?? null) as DocumentPipeline | null;

  return (
    <>
      <PageHeader
        eyebrow="Storage"
        title="Database Activity"
        description="Capacity, table footprint, private storage and document pipeline health. This page measures the live database; it does not browse table contents."
        actions={<AutoRefresh intervalSeconds={120} label="Capacity readings" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Database" value={overview.databaseName} hint={formatBytes(overview.sizeBytes)} />
        <Stat
          label="Connections"
          value={`${formatNumber(overview.connections)} / ${formatNumber(overview.maxConnections)}`}
          hint="Backends on this database"
          tone="navy"
        />
        <Stat
          label="Cache hit ratio"
          value={overview.cacheHitRatio === null ? "—" : `${overview.cacheHitRatio}%`}
          hint="Shared buffer hit rate"
          tone={
            overview.cacheHitRatio !== null && overview.cacheHitRatio < 95 ? "gold" : "forest"
          }
        />
        <Stat
          label="Private storage"
          value={formatBytes(overview.storage.bytes)}
          hint={`${formatNumber(overview.storage.objects)} objects in the documents bucket`}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel title="Telemetry volume">
          <dl>
            <DetailRow label="Authentication events">{formatNumber(overview.telemetry.authEvents)}</DetailRow>
            <DetailRow label="Issue groups">{formatNumber(overview.telemetry.issues)}</DetailRow>
            <DetailRow label="Audit entries">{formatNumber(overview.telemetry.auditEntries)}</DetailRow>
          </dl>
          <p className="mt-3 text-[11px] leading-4 text-[var(--adm-muted)]">
            Retention limits are enforced from Settings. Purging only removes telemetry older than
            the configured window; workspace data is untouched.
          </p>
        </Panel>

        <Panel title="Document pipeline">
          <dl>
            <DetailRow label="Total documents">{formatNumber(overview.documents.total)}</DetailRow>
            <DetailRow label="Processing">{formatNumber(overview.documents.processing)}</DetailRow>
            <DetailRow label="Awaiting review">{formatNumber(overview.documents.needsReview)}</DetailRow>
            <DetailRow label="Recorded failures">{formatNumber(overview.documents.failed)}</DetailRow>
            <DetailRow label="OCR documents">{formatNumber(pipeline?.ocrDocuments ?? 0)}</DetailRow>
            <DetailRow label="Average OCR confidence">
              {pipeline?.averageConfidence === null || pipeline?.averageConfidence === undefined
                ? "—"
                : `${pipeline.averageConfidence}%`}
            </DetailRow>
            <DetailRow label="Last processed">
              {pipeline?.latestProcessedAt ? formatDateTime(pipeline.latestProcessedAt) : "—"}
            </DetailRow>
          </dl>
        </Panel>

        <Panel
          title="Recent database issues"
          actions={
            <Link href="/admin/issues?q=database" className="admin-link text-[11.5px]">
              All issues
            </Link>
          }
        >
          {overview.recentDatabaseIssues.length === 0 ? (
            <p className="text-[12px] text-[var(--adm-muted)]">
              No database-category errors have been recorded.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {overview.recentDatabaseIssues.map((issue) => (
                <li key={issue.id} className="border-b border-[var(--adm-line)] pb-2.5 last:border-b-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/issues/${issue.id}`} className="admin-link min-w-0 truncate text-[11.5px]">
                      {issue.message}
                    </Link>
                    <StatusBadge value={issue.severity} />
                  </div>
                  <p className="mt-0.5 text-[10.5px] text-[var(--adm-muted)]">
                    {issue.status} · {formatDateTime(issue.lastSeenAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-3">
        <Panel
          title="Table footprint"
          description="Live row estimates and total relation size for public tables, largest first."
          padded={false}
        >
          <div className="overflow-x-auto">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Table</th>
                  <th>Estimated rows</th>
                  <th>Size</th>
                </tr>
              </thead>
              <tbody>
                {overview.tables.length === 0 ? (
                  <EmptyRow colSpan={3} message="No public tables were reported." />
                ) : (
                  overview.tables.map((table) => (
                    <tr key={table.name}>
                      <td className="admin-mono text-[11.5px]">{table.name}</td>
                      <td className="tabular-nums text-[12px]">{formatNumber(table.rows)}</td>
                      <td className="tabular-nums text-[12px]">{formatBytes(table.sizeBytes)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Panel>
        <p className="mt-2 text-[10.5px] text-[var(--adm-muted)]">
          Snapshot generated {formatDateTime(overview.generatedAt)}. Row counts are Postgres
          estimates from the live statistics collector.
        </p>
      </div>
    </>
  );
}
