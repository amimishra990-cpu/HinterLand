import type { Metadata } from "next";

import { CommunicationWorkspace } from "@/components/communication/communication-workspace";

export const instant = false;

export const metadata: Metadata = {
  title: "Communication",
  description: "Refine a message while preserving your intended meaning.",
};

export default function CommunicationPage() {
  return <CommunicationWorkspace />;
}
