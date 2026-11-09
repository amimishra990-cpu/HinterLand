import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function FeatureCard({
  icon: Icon,
  title,
  description,
  status,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  status: "MVP scope" | "Planned next" | "Long-term";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "card-lift flex flex-col border border-ink/12 bg-background p-6 transition-colors hover:border-ink/25",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <Icon
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-5 text-forest"
        />
        <Badge variant={status === "MVP scope" ? "default" : "muted"}>
          {status}
        </Badge>
      </div>
      <h3 className="mt-7 font-heading text-[22px] leading-snug text-ink">
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-ink/70">{description}</p>
    </div>
  );
}
