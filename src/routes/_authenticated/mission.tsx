import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/mission")({
  component: MissionPage,
});

function MissionPage() {
  return <PageHeader title="Mission" description="Loading this section." />;
}
