import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/problems/")({
  component: ProblemsPage,
});

function ProblemsPage() {
  return <PageHeader title="Problems" description="Loading this section." />;
}
