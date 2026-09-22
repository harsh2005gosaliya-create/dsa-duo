import { createFileRoute } from "@tanstack/react-router";
import { Check, Route as RouteIcon } from "lucide-react";
import { useRoadmap } from "@/hooks/useForge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/roadmap")({
  component: RoadmapPage,
});

function RoadmapPage() {
  const { user } = useAuth();
  const { data: roadmap, isLoading } = useRoadmap();
  const queryClient = useQueryClient();

  if (isLoading || !roadmap) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  const { phases = [], progress = [] } = roadmap;
  const progressMap = new Map(progress.map((p) => [p.phase_id, p]));

  const toggleCheck = async (phaseId: string, item: string, isChecked: boolean) => {
    if (!user) return;
    const current = progressMap.get(phaseId)?.checked ?? [];
    const nextChecked = isChecked
      ? [...current, item]
      : current.filter((c) => c !== item);

    await supabase.from("user_phase_progress").upsert(
      {
        user_id: user.id,
        phase_id: phaseId,
        checked: nextChecked,
        started: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,phase_id" }
    );

    queryClient.invalidateQueries({ queryKey: ["roadmap"] });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="DSA Mastery Roadmap"
        description="Structured curriculum from fundamentals and two pointers to dynamic programming and advanced graph algorithms."
      />

      <div className="grid gap-4 md:grid-cols-2">
        {phases.map((phase) => {
          const prog = progressMap.get(phase.id);
          const checkedItems = new Set(prog?.checked ?? []);
          const totalChecklist = phase.checklist.length;
          const completedCount = phase.checklist.filter((c) => checkedItems.has(c)).length;

          return (
            <Card key={phase.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="font-mono text-xs">
                    Phase {phase.phase_order}
                  </Badge>
                  <span className="text-xs font-mono text-muted-foreground">
                    {completedCount} / {totalChecklist} done
                  </span>
                </div>
                <CardTitle className="text-base mt-2">{phase.title}</CardTitle>
                <CardDescription className="text-xs">{phase.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                <div className="space-y-1.5 pt-2 border-t border-border/60">
                  {phase.checklist.map((item) => {
                    const isDone = checkedItems.has(item);
                    return (
                      <div
                        key={item}
                        className="flex items-center space-x-2 text-xs py-0.5 cursor-pointer"
                        onClick={() => toggleCheck(phase.id, item, !isDone)}
                      >
                        <Checkbox checked={isDone} />
                        <span className={isDone ? "line-through text-muted-foreground" : ""}>
                          {item}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
