"use client";

import { useEffect } from "react";

type Report = {
  message: string;
  route?: string;
  severity?: "warning" | "error" | "critical";
  metadata?: Record<string, unknown>;
};

const recent = new Map<string, number>();
const THROTTLE_MS = 5_000;

function shouldSend(key: string) {
  const now = Date.now();
  const last = recent.get(key) ?? 0;
  if (now - last < THROTTLE_MS) return false;
  recent.set(key, now);
  if (recent.size > 50) {
    for (const [entry, time] of recent) {
      if (now - time > THROTTLE_MS) recent.delete(entry);
    }
  }
  return true;
}

export function reportClientError(report: Report) {
  if (typeof window === "undefined") return;
  const route = report.route ?? window.location.pathname;
  const key = `${report.severity ?? "error"}:${route}:${report.message}`;
  if (!shouldSend(key)) return;

  const payload = JSON.stringify({
    category: "frontend",
    severity: report.severity ?? "error",
    message: report.message.slice(0, 800),
    route,
    metadata: report.metadata ?? {},
  });

  try {
    const blob = new Blob([payload], { type: "application/json" });
    if (navigator.sendBeacon("/api/monitor", blob)) return;
  } catch {
    // Fall through to fetch.
  }

  void fetch("/api/monitor", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: payload,
    keepalive: true,
  }).catch(() => {
    // Monitoring must never break the page.
  });
}

export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError({
        message: event.message || "Unhandled client error",
        metadata: { kind: "window_error" },
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const message =
        reason instanceof Error
          ? `${reason.name}: ${reason.message}`
          : typeof reason === "string"
            ? reason
            : "Unhandled promise rejection";
      reportClientError({
        message,
        metadata: { kind: "unhandled_rejection" },
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
