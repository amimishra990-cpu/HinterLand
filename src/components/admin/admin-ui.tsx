import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="admin-eyebrow">{eyebrow}</p>
        <h1 className="mt-1 font-heading text-[26px] leading-tight tracking-[-0.01em]">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-[68ch] text-[12.5px] leading-5 text-[var(--adm-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
  padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section className={cn("admin-card min-w-0", className)}>
      {title || actions ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--adm-line)] px-4 py-3">
          <div className="min-w-0">
            {title ? <h2 className="text-[13.5px] font-semibold">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-[11.5px] text-[var(--adm-muted)]">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={padded ? "p-4" : undefined}>{children}</div>
    </section>
  );
}

const STAT_TONES: Record<string, string> = {
  neutral: "var(--adm-ink)",
  forest: "var(--adm-forest)",
  gold: "#8a6a28",
  terracotta: "var(--adm-terracotta)",
  red: "var(--adm-red)",
  navy: "var(--adm-navy)",
};

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <div className="admin-card px-4 py-3.5">
      <p className="text-[9.5px] font-semibold tracking-[0.14em] uppercase text-[var(--adm-muted)]">
        {label}
      </p>
      <p
        className="mt-1.5 font-heading text-[25px] leading-none tabular-nums"
        style={{ color: STAT_TONES[tone] }}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1.5 text-[11px] leading-4 text-[var(--adm-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

const STATUS_TONES: Record<string, string> = {
  operational: "admin-badge-forest",
  active: "admin-badge-forest",
  resolved: "admin-badge-forest",
  success: "admin-badge-forest",
  verified: "admin-badge-forest",
  degraded: "admin-badge-gold",
  warning: "admin-badge-gold",
  investigating: "admin-badge-gold",
  "pending verification": "admin-badge-gold",
  pending: "admin-badge-gold",
  unknown: "admin-badge-neutral",
  info: "admin-badge-neutral",
  open: "admin-badge-terracotta",
  ignored: "admin-badge-neutral",
  unavailable: "admin-badge-red",
  critical: "admin-badge-red",
  error: "admin-badge-terracotta",
  suspended: "admin-badge-red",
  "not configured": "admin-badge-navy",
};

export function StatusBadge({ value }: { value: string }) {
  const tone = STATUS_TONES[value.toLowerCase()] ?? "admin-badge-neutral";
  return <span className={cn("admin-badge", tone)}>{value}</span>;
}

export function EmptyRow({
  colSpan,
  message = "Nothing recorded for this selection.",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-[12px] text-[var(--adm-muted)]">
        {message}
      </td>
    </tr>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="px-4 py-10 text-center">
      <p className="text-[13px] font-medium">{title}</p>
      {description ? (
        <p className="mx-auto mt-1 max-w-[48ch] text-[12px] text-[var(--adm-muted)]">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--adm-line)] py-2 last:border-b-0">
      <dt className="text-[11.5px] text-[var(--adm-muted)]">{label}</dt>
      <dd className="text-right text-[12.5px] font-medium">{children}</dd>
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
  query,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
  query: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (total === 0) return null;

  const href = (nextPage: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value && key !== "page") params.set(key, value);
    }
    if (nextPage > 1) params.set("page", String(nextPage));
    const search = params.toString();
    return search ? `${basePath}?${search}` : basePath;
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--adm-line)] px-4 py-3">
      <p className="text-[11.5px] text-[var(--adm-muted)]">
        {total.toLocaleString("en-GB")} record{total === 1 ? "" : "s"} · page {page} of {pages}
      </p>
      <div className="flex items-center gap-1.5">
        {page > 1 ? (
          <Link href={href(page - 1)} className="admin-btn admin-btn-secondary admin-btn-sm">
            Previous
          </Link>
        ) : (
          <span className="admin-btn admin-btn-secondary admin-btn-sm pointer-events-none opacity-45">
            Previous
          </span>
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className="admin-btn admin-btn-secondary admin-btn-sm">
            Next
          </Link>
        ) : (
          <span className="admin-btn admin-btn-secondary admin-btn-sm pointer-events-none opacity-45">
            Next
          </span>
        )}
      </div>
    </div>
  );
}

export function Notice({
  tone = "error",
  children,
}: {
  tone?: "error" | "info";
  children: ReactNode;
}) {
  return (
    <div
      className="rounded-md border px-3 py-2 text-[12px]"
      style={
        tone === "error"
          ? {
              borderColor: "rgba(156, 68, 54, 0.3)",
              backgroundColor: "var(--adm-red-soft)",
              color: "var(--adm-red)",
            }
          : {
              borderColor: "var(--adm-line)",
              backgroundColor: "var(--adm-panel-soft)",
              color: "var(--adm-ink-soft)",
            }
      }
      role={tone === "error" ? "alert" : undefined}
    >
      {children}
    </div>
  );
}
