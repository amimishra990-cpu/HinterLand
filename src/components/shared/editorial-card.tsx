import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function EditorialCard({
  label,
  meta,
  children,
  className,
}: {
  label?: ReactNode;
  meta?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-lift border border-ink/12 bg-background p-5 transition-colors hover:border-ink/25",
        className
      )}
    >
      {label || meta ? (
        <div className="flex items-start justify-between gap-4">
          {label ? (
            <p className="eyebrow text-ink/70">{label}</p>
          ) : (
            <span />
          )}
          {meta ? (
            <span className="shrink-0 text-[11px] leading-4 text-ink/70">
              {meta}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
