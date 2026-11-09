import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Swords, Timer, Trophy } from "lucide-react";
import { useTraining } from "@/hooks/useForge";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/mock-oa")({
  component: MockOAPage,
});

function MockOAPage() {
  const { data: training, isLoading } = useTraining();

  if (isLoading || !training) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const mocks = training.mocks ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mock OA Assessment"
        description="Simulate real online assessments under strict time limits without hints or external help."
      />

      <Card className="border-border bg-gradient-to-r from-card to-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Swords className="size-4 text-primary" />
            Standard 60-Minute Assessment
          </CardTitle>
          <CardDescription>
            2 Medium problems under a 60-minute countdown. Test yourself under interview pressure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="gap-2">
            <Timer className="size-4" /> Start New Simulation
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Past OA Attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {mocks.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              No simulation attempts completed yet.
            </p>
          ) : (
            <div className="space-y-2">
              {mocks.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{m.difficulty_mode}</Badge>
                    <span>{m.duration_min} min</span>
                  </div>
                  <div className="flex items-center gap-3 font-mono">
                    <span>{m.solved_count} solved</span>
                    <span className="text-muted-foreground">{m.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
