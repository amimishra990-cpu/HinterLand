import { Suspense } from "react";
import type { Metadata } from "next";

import { ProjectsWorkspace } from "@/components/projects/projects-workspace";
import { WorkspaceFallback } from "@/components/app/workspace-fallback";

export const instant = false;

export const metadata: Metadata = {
  title: "Projects & Documents",
  description:
    "Project context and a document library with previews and analysis.",
};

type ProjectsSearchParams = Promise<{
  tab?: string;
  project?: string;
  doc?: string;
  action?: string;
}>;

async function ProjectsRoute({
  searchParams,
}: {
  searchParams: ProjectsSearchParams;
}) {
  const params = await searchParams;
  return (
    <ProjectsWorkspace
      initialTab={params.tab}
      initialProject={params.project}
      initialDoc={params.doc}
      initialAction={params.action}
    />
  );
}

export default function ProjectsPage({
  searchParams,
}: {
  searchParams: ProjectsSearchParams;
}) {
  return (
    <Suspense fallback={<WorkspaceFallback />}>
      <ProjectsRoute searchParams={searchParams} />
    </Suspense>
  );
}
