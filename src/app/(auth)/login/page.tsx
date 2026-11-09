import type { Metadata } from "next";

import { LoginForm } from "./login-form";
import { safeRedirectPath } from "@/lib/validation";

export const metadata: Metadata = { title: "Sign in" };
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      next={safeRedirectPath(params.next)}
      reason={params.reason}
      linkError={params.error === "link-invalid" ? "link-invalid" : undefined}
    />
  );
}
