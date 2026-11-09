import { Suspense } from "react";
import type { Metadata } from "next";

import { KnowledgeWorkspace } from "@/components/knowledge/knowledge-workspace";
import { WorkspaceFallback } from "@/components/app/workspace-fallback";

export const instant = false;

export const metadata: Metadata = {
  title: "Knowledge Repository",
  description: "Search approved records, decisions, briefs, and refinements.",
};

async function KnowledgeRoute({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; record?: string }>;
}) {
  const params = await searchParams;
  return (
    <KnowledgeWorkspace
      focusSearch={params.focus === "search"}
      initialRecord={params.record}
    />
  );
}

export default function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ focus?: string; record?: string }>;
}) {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <KnowledgeRoute searchParams={searchParams} />
    </Suspense>
  );
}
