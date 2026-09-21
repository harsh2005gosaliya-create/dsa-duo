import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: AchievementsPage,
});

function AchievementsPage() {
  return <PageHeader title="Achievements" description="Loading this section." />;
}
