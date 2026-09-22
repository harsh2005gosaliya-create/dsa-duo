import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, CheckCircle2, RotateCw, ExternalLink } from "lucide-react";
import { useTraining } from "@/hooks/useForge";
import { todayISO, DIFFICULTY_CLASS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/review")({
  component: ReviewPage,
});

function ReviewPage() {
  const { data: training, isLoading } = useTraining();

  if (isLoading || !training) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { reviews = [] } = training;
  const today = todayISO();

  const dueReviews = reviews.filter((r) => r.status === "pending" && r.due_date <= today);
  const upcomingReviews = reviews.filter((r) => r.status === "pending" && r.due_date > today);
  const completedReviews = reviews.filter((r) => r.status === "completed");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Spaced Review"
        description="Strengthen pattern recognition by re-solving questions at intervals (Day 1, 3, 7, 14, 30)."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* DUE FOR REVIEW */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Clock className="size-4 text-amber-500" />
              Due Today ({dueReviews.length})
            </h2>
          </div>

          {dueReviews.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-xs text-muted-foreground">
              No reviews due today! You're completely caught up.
            </Card>
          ) : (
            <div className="space-y-2.5">
              {dueReviews.map((rev) => {
                const p = rev.problem;
                if (!p) return null;
                return (
                  <Card key={rev.id} className="border-border">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={cn(
                              "rounded border px-1.5 py-0.5 text-[10px] font-mono",
                              DIFFICULTY_CLASS[p.difficulty ?? "Easy"]
                            )}
                          >
                            {p.difficulty}
                          </span>
                          <span className="text-xs text-muted-foreground">{p.topic}</span>
                        </div>
                        <h3 className="text-sm font-semibold mt-1 truncate">
                          <Link to="/problems/$id" params={{ id: p.id }}>
                            {p.title}
                          </Link>
                        </h3>
                      </div>

                      <Button asChild size="sm" className="gap-1 text-xs">
                        <Link to="/problems/$id" params={{ id: p.id }}>
                          Re-solve <RotateCw className="size-3" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* UPCOMING REVIEWS */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Upcoming Queue ({upcomingReviews.length})
            </h2>
          </div>

          {upcomingReviews.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-xs text-muted-foreground">
              No upcoming scheduled reviews yet.
            </Card>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {upcomingReviews.slice(0, 10).map((rev) => {
                const p = rev.problem;
                if (!p) return null;
                return (
                  <div
                    key={rev.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border text-xs"
                  >
                    <span className="truncate font-medium">{p.title}</span>
                    <span className="font-mono text-muted-foreground shrink-0 ml-2">
                      Due: {rev.due_date}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
