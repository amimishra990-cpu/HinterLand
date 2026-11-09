import type { Metadata } from "next";

import { DevelopmentWorkspace } from "@/components/development/development-workspace";

export const instant = false;

export const metadata: Metadata = {
  title: "My Development",
  description: "Communication preferences, approved examples, and feedback history.",
};

export default function DevelopmentPage() {
  return <DevelopmentWorkspace />;
}
