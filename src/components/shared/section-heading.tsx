import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { WordRevealText } from "@/components/shared/word-reveal";

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <div
        data-reveal
        className={cn(
          "flex items-center gap-3",
          align === "center" && "justify-center"
        )}
      >
        <span
          aria-hidden="true"
          data-draw
          className="h-px w-8 bg-terracotta"
        />
        <p className="eyebrow">{eyebrow}</p>
      </div>
      <h2
        data-word-reveal
        data-words-ready="true"
        className="mt-5 text-balance font-heading text-[clamp(2rem,4vw,2.9rem)] leading-[1.08] text-ink"
      >
        <WordRevealText>{title}</WordRevealText>
      </h2>
      {lead ? (
        <p
          data-reveal
          data-reveal-delay="0.1"
          className={cn(
            "mt-5 max-w-2xl text-pretty text-[17px] leading-8 text-ink/70",
            align === "center" && "mx-auto"
          )}
        >
          {lead}
        </p>
      ) : null}
    </div>
  );
}
