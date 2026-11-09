import { Suspense } from "react";
import type { Metadata } from "next";

import { PreparationWorkspace } from "@/components/preparation/preparation-workspace";
import { WorkspaceFallback } from "@/components/app/workspace-fallback";

export const instant = false;

export const metadata: Metadata = {
  title: "Meeting Preparation",
  description:
    "Build a working brief from an agenda and the material you already have.",
};

async function PreparationRoute({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>;
}) {
  const params = await searchParams;
  return <PreparationWorkspace initialMeeting={params.meeting} />;
}

export default function PreparationPage({
  searchParams,
}: {
  searchParams: Promise<{ meeting?: string }>;
}) {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <PreparationRoute searchParams={searchParams} />
    </Suspense>
  );
}
