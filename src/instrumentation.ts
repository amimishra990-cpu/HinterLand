import type { Instrumentation } from "next";

export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  try {
    const { reportIssue } = await import("@/lib/telemetry");
    const digest =
      typeof error === "object" && error !== null && "digest" in error
        ? String((error as { digest?: string }).digest ?? "")
        : "";
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unhandled server error";

    await reportIssue({
      category: context.routeType === "action" ? "server_action" : "server",
      severity: "error",
      message,
      route: request.path ?? context.routePath,
      metadata: {
        digest: digest || undefined,
        method: request.method,
        routeType: context.routeType,
        routePath: context.routePath,
        routerKind: context.routerKind,
      },
    });
  } catch (reportError) {
    console.error(
      "Server error reporting failed",
      reportError instanceof Error ? reportError.message : "unknown"
    );
  }
};
