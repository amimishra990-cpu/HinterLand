import type { Metadata } from "next";

import "@/app/app-theme.css";
import { WorkspaceGate } from "@/components/app/workspace-gate";

export const metadata: Metadata = {
  title: {
    default: "Workspace",
    template: "%s · Hinterland",
  },
  description: "The Hinterland workspace.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <WorkspaceGate>{children}</WorkspaceGate>;
}
