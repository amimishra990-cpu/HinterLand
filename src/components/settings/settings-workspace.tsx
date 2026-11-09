"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  ArrowRight,
  Bell,
  CircleAlert,
  Database,
  Info,
  LogOut,
  RotateCcw,
  Save,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import { useToast } from "@/components/app/toast";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  SectionHeading,
} from "@/components/app/ui";
import { useWorkspace } from "@/components/app/workspace-provider";
import { signOutAction } from "@/app/(auth)/actions";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from "@/lib/workspace-types";

const DEFAULT_NOTIFICATIONS = DEFAULT_NOTIFICATION_PREFERENCES;

function ToggleRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b py-3 last:border-b-0" style={{ borderColor: "var(--app-line)" }}>
      <div className="min-w-0">
        <p className="text-[12.5px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[11px] leading-4" style={{ color: "var(--app-muted)" }}>
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={() => onChange(!checked)}
        className="relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors"
        style={{ backgroundColor: checked ? "var(--app-forest)" : "var(--app-line-strong)" }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform"
          style={{
            left: 2,
            transform: checked ? "translateX(16px)" : "translateX(0)",
          }}
        />
      </button>
    </div>
  );
}

export function SettingsWorkspace() {
  const toast = useToast();
  const router = useRouter();
  const { profile, updateProfile, resetWorkspace: resetWorkspaceData } = useWorkspace();
  const [fullName, setFullName] = useState(profile.fullName);
  const [role, setRole] = useState(profile.role);
  const [notifications, setNotifications] = useState<NotificationPreferences>(
    profile.notificationPreferences
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const updateNotification = <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setNotifications((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const save = async () => {
    if (!fullName.trim()) {
      setProfileError("Add the name you want shown in your workspace.");
      return;
    }
    setSaving(true);
    const result = await updateProfile({
      fullName: fullName.trim(),
      role: role.trim(),
      notificationPreferences: notifications,
    });
    setSaving(false);
    if (!result.ok) {
      setProfileError(result.error ?? "Profile settings could not be saved.");
      toast(result.error ?? "Profile settings could not be saved.", "error");
      return;
    }
    setProfileError(null);
    setSaved(true);
    toast("Profile and notification preferences saved to your account.", "success");
  };

  const resetWorkspace = async () => {
    setResetting(true);
    const result = await resetWorkspaceData();
    setResetting(false);
    if (!result.ok) {
      toast(result.error ?? "The workspace could not be reset.", "error");
      return;
    }
    setConfirmOpen(false);
    toast("Workspace cleared. Your new workspace is empty.", "success");
    router.push("/app");
  };

  const deleteAccount = async () => {
    if (deleteConfirm.trim() !== "DELETE") {
      setDeleteError("Type DELETE in the confirmation field.");
      return;
    }
    if (!deletePassword) {
      setDeleteError("Enter your password to confirm.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const response = await fetch("/api/account", {
        method: "DELETE",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirm.trim() }),
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setDeleteError(body?.error ?? "The account could not be deleted.");
        setDeleting(false);
        return;
      }
      setDeleting(false);
      router.push("/?account=deleted");
      router.refresh();
    } catch {
      setDeleteError("The account could not be deleted. Check your connection and try again.");
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Settings"
        description="Manage your profile, notifications, account session, and the data stored in your workspace."
        actions={<Badge tone="forest">Private to you</Badge>}
      />

      <div className="grid gap-4 xl:grid-cols-12">
        <div className="space-y-4 xl:col-span-5">
          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Profile"
              description="The identity shown across your workspace."
              action={
                <Badge tone={profile.emailVerified ? "forest" : "gold"}>
                  {profile.emailVerified ? "Email verified" : "Email unverified"}
                </Badge>
              }
            />
            <div className="mt-4 flex items-center gap-3">
              <Avatar name={profile.fullName} size={46} />
              <div className="min-w-0">
                <p className="font-heading text-[18px] leading-snug">{profile.fullName}</p>
                <p className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                  {profile.email}
                </p>
              </div>
            </div>
            <form
              className="mt-4 space-y-3"
              onSubmit={(event) => {
                event.preventDefault();
                void save();
              }}
            >
              <Field label="Full name" htmlFor="profile-name" required>
                <Input
                  id="profile-name"
                  value={fullName}
                  onChange={(event) => {
                    setFullName(event.target.value);
                    if (profileError) setProfileError(null);
                  }}
                  autoComplete="name"
                />
              </Field>
              <Field label="Role" htmlFor="profile-role" hint="Optional. Shown beside your name.">
                <Input
                  id="profile-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="e.g. Programme lead"
                />
              </Field>
              <Field label="Email" htmlFor="profile-email">
                <Input id="profile-email" value={profile.email} readOnly disabled />
              </Field>
              {profileError ? (
                <p className="flex items-start gap-1.5 text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
                  <CircleAlert size={13} className="mt-0.5 shrink-0" aria-hidden="true" />
                  {profileError}
                </p>
              ) : null}
              <Button type="submit" disabled={saving}>
                <Save size={14} aria-hidden="true" />
                {saving ? "Saving…" : saved ? "Saved" : "Save profile"}
              </Button>
            </form>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <form action={signOutAction}>
                <Button type="submit" variant="secondary" size="sm">
                  <LogOut size={13} aria-hidden="true" />
                  Sign out
                </Button>
              </form>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-[12px] font-medium"
                style={{ color: "var(--app-forest)" }}
              >
                <ArrowRight size={12} aria-hidden="true" />
                Public site
              </Link>
            </div>
          </Card>

          <Card soft className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} style={{ color: "var(--app-forest)" }} aria-hidden="true" />
              <h2 className="font-heading text-[17px]">Privacy in this workspace</h2>
            </div>
            <ul className="mt-2.5 space-y-2">
              {[
                "Projects, documents, and knowledge records are stored in your Supabase account.",
                "Row-level security limits every table and storage object to your user id.",
                "Original uploads live in private storage and are served through short-lived signed URLs.",
                "You approve a record before it can be saved, copied, or exported.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-[11.5px] leading-5" style={{ color: "var(--app-ink-soft)" }}>
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--app-gold)" }}
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/#principles"
              className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium"
              style={{ color: "var(--app-forest)" }}
            >
              Read the product principles
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </Card>
        </div>

        <div className="space-y-4 xl:col-span-7">
          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Notification preferences"
              description="Stored with your profile. Notifications shown in the top bar are derived from your open records."
              action={<Bell size={15} style={{ color: "var(--app-muted)" }} aria-label="Notifications" />}
            />
            <div className="mt-2">
              <ToggleRow
                title="Meeting preparation reminders"
                description="Show a reminder before an upcoming meeting that has a brief."
                checked={notifications.meetingReminders}
                onChange={(next) => updateNotification("meetingReminders", next)}
              />
              <ToggleRow
                title="Approval requests"
                description="Show when a meeting record is waiting for your review."
                checked={notifications.approvalRequests}
                onChange={(next) => updateNotification("approvalRequests", next)}
              />
              <ToggleRow
                title="Weekly action digest"
                description="Collect open action items into a local weekly summary."
                checked={notifications.weeklySummary}
                onChange={(next) => updateNotification("weeklySummary", next)}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={saved ? "gold" : "primary"}
                onClick={() => void save()}
                disabled={saving}
              >
                <Save size={14} aria-hidden="true" />
                {saving ? "Saving…" : saved ? "Saved" : "Save preferences"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setNotifications(DEFAULT_NOTIFICATIONS);
                  setSaved(false);
                  toast("Notification preferences reset. Save to keep them.", "info");
                }}
              >
                <RotateCcw size={14} aria-hidden="true" />
                Reset
              </Button>
              <span className="text-[10.5px]" style={{ color: "var(--app-muted)" }}>
                Saved with your profile.
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <SectionHeading
              title="Data and workspace"
              description="Where your workspace data lives and who can read it."
              action={<Database size={15} style={{ color: "var(--app-muted)" }} aria-label="Data" />}
            />
            <dl className="mt-3 divide-y" style={{ borderColor: "var(--app-line)" }}>
              {[
                {
                  label: "Workspace theme",
                  value: "Warm light · fixed",
                },
                { label: "Data storage", value: "Supabase Postgres (RLS)" },
                { label: "Document storage", value: "Private Supabase bucket" },
                { label: "AI provider", value: "Server-side · configured separately" },
                { label: "Sharing", value: "Nothing is shared between users" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex flex-wrap items-center justify-between gap-2 py-2.5"
                  style={{ borderColor: "var(--app-line)" }}
                >
                  <dt className="text-[11.5px]" style={{ color: "var(--app-muted)" }}>
                    {row.label}
                  </dt>
                  <dd className="text-[12px] font-medium">{row.value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 rounded-md border px-3.5 py-3" style={{ borderColor: "rgba(163, 90, 60, .32)", backgroundColor: "var(--app-terracotta-soft)" }}>
              <div className="flex items-start gap-2">
                <CircleAlert size={14} className="mt-0.5 shrink-0" style={{ color: "var(--app-terracotta)" }} aria-hidden="true" />
                <div>
                  <p className="text-[12px] font-semibold">Reset your workspace</p>
                  <p className="mt-0.5 text-[11px] leading-4" style={{ color: "var(--app-ink-soft)" }}>
                    Deletes your projects, documents, meetings, records, examples, and stored
                    files, leaving a clean, empty workspace. This cannot be undone.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <RotateCcw size={13} aria-hidden="true" />
                    Reset workspace
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-md border px-3.5 py-3" style={{ borderColor: "rgba(163, 90, 60, .32)", backgroundColor: "var(--app-terracotta-soft)" }}>
              <div className="flex items-start gap-2">
                <CircleAlert size={14} className="mt-0.5 shrink-0" style={{ color: "var(--app-terracotta)" }} aria-hidden="true" />
                <div>
                  <p className="text-[12px] font-semibold">Delete your account</p>
                  <p className="mt-0.5 text-[11px] leading-4" style={{ color: "var(--app-ink-soft)" }}>
                    Permanently deletes your login and every project, document, meeting, record,
                    and stored file. Requires your password and cannot be undone.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    onClick={() => {
                      setDeletePassword("");
                      setDeleteConfirm("");
                      setDeleteError(null);
                      setDeleteOpen(true);
                    }}
                  >
                    <Trash2 size={13} aria-hidden="true" />
                    Delete account
                  </Button>
                </div>
              </div>
            </div>

            <p className="mt-3 flex items-start gap-2 text-[11px] leading-4" style={{ color: "var(--app-muted)" }}>
              <Info size={12} className="mt-0.5 shrink-0" style={{ color: "var(--app-gold)" }} aria-hidden="true" />
              Account authentication, per-user data isolation, and private document storage
              are handled by Supabase. Billing and team access are not implemented.
            </p>
          </Card>
        </div>
      </div>

      <Modal
        open={confirmOpen}
        onClose={() => {
          if (!resetting) setConfirmOpen(false);
        }}
        title="Reset your workspace?"
        description="Your projects, documents, records, and uploaded files will be deleted."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setConfirmOpen(false)}
              disabled={resetting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void resetWorkspace()} disabled={resetting}>
              {resetting ? (
                <>
                  <span className="app-spinner" aria-hidden="true" />
                  Resetting…
                </>
              ) : (
                "Reset workspace"
              )}
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-5">
          This deletes the workspace data stored under your account and leaves it empty. It
          cannot be undone.
        </p>
        <p className="mt-2 text-[11.5px] leading-5" style={{ color: "var(--app-muted)" }}>
          Your login and profile are kept. Only your workspace content is cleared.
        </p>
      </Modal>

      <Modal
        open={deleteOpen}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        title="Delete your account?"
        description="This permanently deletes your account and everything stored under it."
        size="sm"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={() => void deleteAccount()} disabled={deleting}>
              {deleting ? (
                <>
                  <span className="app-spinner" aria-hidden="true" />
                  Deleting…
                </>
              ) : (
                "Delete account"
              )}
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-5">
          Your profile, projects, documents, uploaded files, meetings, approved records, action
          items, decisions, and writing examples are deleted. You are signed out immediately and
          the account cannot be recovered.
        </p>
        <div className="mt-3 space-y-3">
          <Field label="Password" htmlFor="delete-account-password" required>
            <Input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={deletePassword}
              onChange={(event) => {
                setDeletePassword(event.target.value);
                if (deleteError) setDeleteError(null);
              }}
            />
          </Field>
          <Field
            label="Type DELETE to confirm"
            htmlFor="delete-account-confirm"
            required
          >
            <Input
              id="delete-account-confirm"
              value={deleteConfirm}
              onChange={(event) => {
                setDeleteConfirm(event.target.value);
                if (deleteError) setDeleteError(null);
              }}
              autoComplete="off"
              placeholder="DELETE"
            />
          </Field>
          {deleteError ? (
            <p className="text-[11.5px]" style={{ color: "var(--app-terracotta)" }} role="alert">
              {deleteError}
            </p>
          ) : null}
        </div>
      </Modal>
    </>
  );
}
