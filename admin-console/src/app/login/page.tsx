import type { Metadata } from "next";

import { safeRedirectPath } from "@/lib/validation";
import { AdminLoginForm } from "./login-form";

export const metadata: Metadata = { title: "Sign in" };
export const instant = false;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <AdminLoginForm
      next={safeRedirectPath(params.next)}
      reason={params.reason}
      linkError={params.error === "link-invalid" ? "link-invalid" : undefined}
    />
  );
}
