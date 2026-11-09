import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { AlertCircle, CircleHelp } from "lucide-react";

import { cn } from "@/lib/utils";

export function LoadingState({
  title,
  detail,
  className,
}: {
  title: string;
  detail?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("border border-ink/12 bg-background p-5", className)}
    >
      <p className="eyebrow text-ink/70">In progress</p>
      <p className="mt-2 font-heading text-lg leading-snug text-ink">{title}</p>
      <div aria-hidden="true" className="mt-4 h-0.5 w-28 bg-stone">
        <div className="h-full w-2/3 bg-forest" />
      </div>
      {detail ? (
        <p className="mt-3 text-xs leading-5 text-ink/70">{detail}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon = CircleHelp,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start border border-dashed border-ink/20 bg-transparent p-6",
        className
      )}
    >
      <Icon
        aria-hidden="true"
        strokeWidth={1.5}
        className="size-5 text-forest"
      />
      <p className="mt-4 font-heading text-lg leading-snug text-ink">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink/70">
        {description}
      </p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border border-terracotta/60 bg-terracotta/[0.06] p-5",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <AlertCircle
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-4 text-accent-ink"
        />
        <p className="eyebrow text-ink/70">Needs attention</p>
      </div>
      <p className="mt-2 font-heading text-lg leading-snug text-ink">{title}</p>
      <p className="mt-1.5 text-xs leading-5 text-ink/70">{description}</p>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}
