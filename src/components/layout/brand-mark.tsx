import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <Link
      href="/"
      aria-label="Hinterland home"
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "grid size-5 place-items-center border transition-colors",
          tone === "light" ? "border-ivory/55" : "border-forest/55"
        )}
      >
        <span
          className={cn(
            "h-2.5 w-px",
            tone === "light" ? "bg-gold" : "bg-terracotta"
          )}
        />
      </span>
      <span
        className={cn(
          "font-heading text-[19px] leading-none font-medium tracking-[0.16em]",
          tone === "light" ? "text-ivory" : "text-ink"
        )}
      >
        HINTERLAND
      </span>
    </Link>
  );
}
