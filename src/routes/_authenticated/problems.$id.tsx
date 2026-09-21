import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/problems/$id")({
  component: ProblemDetailPage,
});

function ProblemDetailPage() {
  return <PageHeader title="Problem" description="Loading." />;
}
