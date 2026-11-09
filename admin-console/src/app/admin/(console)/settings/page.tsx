import type { Metadata } from "next";

import { requireAdminSession } from "@/lib/admin/auth";
import { appVersion, environmentName } from "@/lib/admin/telemetry";
import type { AdminSettings } from "@/lib/admin/types";
import { RetentionButton, SettingsForm } from "@/components/admin/settings-form";
import {
  DetailRow,
  Notice,
  PageHeader,
  Panel,
} from "@/components/admin/admin-ui";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const { supabase, user, profile } = await requireAdminSession();
  const { data, error } = await supabase.rpc("admin_get_settings");
  const settings = (data ?? {}) as AdminSettings;

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Retention windows and monitoring thresholds. Every change is written to the audit log with the acting administrator."
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <Panel
          title="Monitoring"
          description="Stored in the database; applied by the retention run."
          className="lg:col-span-2"
        >
          {error ? (
            <Notice>Settings could not be read: {error.message}</Notice>
          ) : (
            <SettingsForm settings={settings} />
          )}
        </Panel>

        <div className="space-y-3">
          <Panel title="Administrator">
            <dl>
              <DetailRow label="Display name">{profile.full_name || "—"}</DetailRow>
              <DetailRow label="Username">{profile.username ? `@${profile.username}` : "—"}</DetailRow>
              <DetailRow label="Email">{user.email ?? "—"}</DetailRow>
              <DetailRow label="Profile description">
                {profile.bio ? (
                  <span className="block max-w-[34ch] text-right whitespace-pre-line">
                    {profile.bio}
                  </span>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Admin role">
                <span className="admin-badge admin-badge-forest">Verified</span>
              </DetailRow>
              <DetailRow label="Password change required">
                {profile.must_change_password ? "Yes" : "No"}
              </DetailRow>
            </dl>
            <p className="mt-3 text-[11px] leading-4 text-[var(--adm-muted)]">
              Administrator rights are assigned only through the database. This console cannot
              grant, revoke or elevate an account, and no API accepts an admin flag.
            </p>
          </Panel>

          <Panel title="Runtime">
            <dl>
              <DetailRow label="Environment">{environmentName()}</DetailRow>
              <DetailRow label="App version">
                <span className="admin-mono">{appVersion()}</span>
              </DetailRow>
              <DetailRow label="Region">
                {process.env.VERCEL_REGION ?? "—"}
              </DetailRow>
            </dl>
            <p className="mt-3 text-[11px] leading-4 text-[var(--adm-muted)]">
              Credentials for Supabase, AI and email are held only in server environment
              variables. No secret value is rendered in this console.
            </p>
          </Panel>
        </div>
      </div>

      <div className="mt-3">
        <Panel
          title="Telemetry retention"
          description="Deletes only old telemetry. User accounts, workspace data, documents and meetings are never included."
        >
          <RetentionButton />
        </Panel>
      </div>
    </>
  );
}
