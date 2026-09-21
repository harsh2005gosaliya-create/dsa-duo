import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/duo")({
  component: DuoPage,
});

function DuoPage() {
  return <PageHeader title="Duo" description="Loading this section." />;
}
