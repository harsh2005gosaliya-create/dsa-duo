import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/mock-oa")({
  component: MockOaPage,
});

function MockOaPage() {
  return <PageHeader title="MockOa" description="Loading this section." />;
}
