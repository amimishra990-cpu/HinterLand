"use client";

import { useEffect } from "react";

import { reportClientError } from "@/components/app/error-reporter";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      message: error.message || "Global application error",
      severity: "critical",
      metadata: { kind: "global_error_boundary", digest: error.digest ?? "" },
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "grid",
          placeItems: "center",
          backgroundColor: "#f5f2e9",
          color: "#222c25",
          fontFamily: "Georgia, 'Times New Roman', serif",
          padding: "24px",
        }}
      >
        <main style={{ maxWidth: 460, textAlign: "center" }}>
          <p
            style={{
              margin: 0,
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#304e3e",
              fontFamily: "Arial, sans-serif",
            }}
          >
            Hinterland
          </p>
          <h1 style={{ margin: "10px 0 0", fontSize: 30, fontWeight: 500, lineHeight: 1.2 }}>
            The application could not load
          </h1>
          <p style={{ margin: "10px 0 0", fontSize: 14, lineHeight: 1.7, color: "#465247" }}>
            The failure was recorded for the administrator. Reload to try again.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: 20,
              height: 40,
              padding: "0 18px",
              border: 0,
              borderRadius: 4,
              backgroundColor: "#304e3e",
              color: "#f5f2e9",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
