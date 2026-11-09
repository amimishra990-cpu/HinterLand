import type { Metadata } from "next";

import { SettingsWorkspace } from "@/components/settings/settings-workspace";

export const instant = false;

export const metadata: Metadata = {
  title: "Settings",
  description: "Profile, notification preferences, session, and workspace data controls.",
};

export default function SettingsPage() {
  return <SettingsWorkspace />;
}
