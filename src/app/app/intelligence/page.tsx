import type { Metadata } from "next";

import { IntelligenceWorkspace } from "@/components/intelligence/intelligence-workspace";

export const instant = false;

export const metadata: Metadata = {
  title: "Meeting Intelligence",
  description: "Structure meeting notes into a reviewed, approved record.",
};

export default function IntelligencePage() {
  return <IntelligenceWorkspace />;
}
