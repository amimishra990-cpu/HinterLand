import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";

import { requireAdminSession } from "@/lib/admin/auth";
import { AdminSetPasswordForm } from "./set-password-form";

export const metadata: Metadata = {
  title: "Set admin password",
};

export default async function AdminSetPasswordPage() {
  const { profile } = await requireAdminSession({ allowPasswordChange: true });

  return (
    <div className="admin-theme flex min-h-dvh items-center justify-center px-4 py-10">
      <main id="main" className="admin-card w-full max-w-[420px] px-6 py-7">
        <p className="admin-eyebrow flex items-center gap-1.5">
          <ShieldCheck size={12} aria-hidden="true" />
          Administrator bootstrap
        </p>
        <h1 className="mt-2 font-heading text-[27px] leading-tight">
          Choose your console password
        </h1>
        <p className="mt-1.5 text-[12px] leading-5 text-[var(--adm-muted)]">
          {profile.full_name || "Administrator"}, this account was provisioned with a
          one-time password. Replace it now to unlock the admin console.
        </p>
        <AdminSetPasswordForm />
      </main>
    </div>
  );
}
