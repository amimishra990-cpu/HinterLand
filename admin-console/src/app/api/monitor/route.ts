import { NextResponse } from "next/server";

import { reportIssue, sanitizeRoute, sanitizeText } from "@/lib/admin/telemetry";
import { sameOrigin } from "@/lib/api";

const ALLOWED_CATEGORIES = new Set(["frontend", "api_client"]);
const ALLOWED_SEVERITIES = new Set(["warning", "error", "critical"]);

const recent = new Map<string, { count: number; resetAt: number }>();

function throttled(key: string) {
  const now = Date.now();
  const entry = recent.get(key);
  if (!entry || entry.resetAt < now) {
    recent.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 30;
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin request rejected." }, { status: 403 });
  }

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (contentLength > 12_000) {
    return NextResponse.json({ error: "Payload too large." }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as
    | {
        category?: unknown;
        severity?: unknown;
        message?: unknown;
        route?: unknown;
        metadata?: unknown;
      }
    | null;

  if (!body || typeof body.message !== "string") {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  const category = typeof body.category === "string" ? body.category : "frontend";
  const severity = typeof body.severity === "string" ? body.severity : "error";
  if (!ALLOWED_CATEGORIES.has(category) || !ALLOWED_SEVERITIES.has(severity)) {
    return NextResponse.json({ error: "Unsupported report." }, { status: 400 });
  }

  const message = sanitizeText(body.message, 800);
  if (!message) {
    return NextResponse.json({ error: "A message is required." }, { status: 400 });
  }

  const route = sanitizeRoute(typeof body.route === "string" ? body.route : null);
  const userAgent = request.headers.get("user-agent") ?? "";
  const device = /mobile|iphone|android/i.test(userAgent)
    ? "Mobile"
    : /ipad|tablet/i.test(userAgent)
      ? "Tablet"
      : "Desktop";

  if (throttled(`${device}:${route ?? "unknown"}`)) {
    return new NextResponse(null, { status: 204 });
  }

  const metadata: Record<string, unknown> = { device, source: "client" };
  if (body.metadata && typeof body.metadata === "object") {
    const record = body.metadata as Record<string, unknown>;
    if (typeof record.kind === "string") metadata.kind = sanitizeText(record.kind, 60);
    if (typeof record.digest === "string") metadata.digest = sanitizeText(record.digest, 80);
  }

  await reportIssue({
    category,
    severity: severity as "warning" | "error" | "critical",
    message,
    route,
    metadata,
  });

  return new NextResponse(null, { status: 204 });
}
