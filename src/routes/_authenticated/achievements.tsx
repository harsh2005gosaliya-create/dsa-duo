import { createFileRoute } from "@tanstack/react-router";
import { Award, Check, Flame, Lock, ShieldCheck, Target } from "lucide-react";
import { useAchievements, useUnlockedAchievements } from "@/hooks/useForge";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/achievements")({
  component: AchievementsPage,
});

function AchievementsPage() {
  const { data: defs = [], isLoading: defsLoading } = useAchievements();
  const { data: unlocked = [], isLoading: unlockedLoading } = useUnlockedAchievements();

  if (defsLoading || unlockedLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </div>
    );
  }

  const unlockedMap = new Map(unlocked.map((u) => [u.code, u.unlocked_at]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Achievements"
        description="Milestones unlocked through real practice, consistent streaks, and duo training."
      />

      <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <span>Unlocked:</span>
        <Badge variant="secondary">
          {unlocked.length} / {defs.length}
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {defs.map((ach) => {
          const isUnlocked = unlockedMap.has(ach.code);
          const unlockedAt = unlockedMap.get(ach.code);

          return (
            <Card
              key={ach.code}
              className={cn(
                "border transition-all",
                isUnlocked
                  ? "border-primary/40 bg-gradient-to-br from-card to-primary/5"
                  : "border-border/60 bg-muted/20 opacity-60"
              )}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={cn(
                    "grid size-10 place-items-center rounded-lg shrink-0",
                    isUnlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}
                >
                  {isUnlocked ? <Award className="size-5" /> : <Lock className="size-4" />}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold truncate">{ach.title}</h3>
                    {isUnlocked && (
                      <span className="flex items-center gap-0.5 text-[10px] text-emerald-500 font-mono">
                        <Check className="size-3" /> Unlocked
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{ach.description}</p>
                  {unlockedAt && (
                    <p className="text-[10px] text-muted-foreground/80 font-mono pt-1">
                      {new Date(unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
