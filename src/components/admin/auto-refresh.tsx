"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({
  intervalSeconds = 60,
  label = "Live data",
}: {
  intervalSeconds?: number;
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [paused, setPaused] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(() => new Date());

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      startTransition(() => {
        router.refresh();
        setLastRefresh(new Date());
      });
    }, intervalSeconds * 1000);
    return () => window.clearInterval(timer);
  }, [intervalSeconds, paused, router]);

  return (
    <div className="flex items-center gap-2 text-[11px] text-[var(--adm-muted)]">
      <span
        className="admin-dot"
        style={{ backgroundColor: paused ? "var(--adm-sage)" : "var(--adm-forest)" }}
        aria-hidden="true"
      />
      <span>
        {label} · {paused ? "paused" : `refreshes every ${intervalSeconds}s`} ·{" "}
        {lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
      </span>
      {pending ? <span className="admin-spinner" aria-label="Refreshing" /> : null}
      <button
        type="button"
        onClick={() => setPaused((value) => !value)}
        className="admin-btn admin-btn-ghost admin-btn-sm"
        aria-pressed={paused}
      >
        {paused ? "Resume" : "Pause"}
      </button>
      <button
        type="button"
        onClick={() =>
          startTransition(() => {
            router.refresh();
            setLastRefresh(new Date());
          })
        }
        className="admin-btn admin-btn-ghost admin-btn-sm"
      >
        Refresh now
      </button>
    </div>
  );
}
