import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
  return <PageHeader title="Roadmap" description="Loading this section." />;
}
