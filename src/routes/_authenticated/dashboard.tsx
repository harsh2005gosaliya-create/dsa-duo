import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { ArrowRight, ExternalLink, Flame, TrendingUp } from "lucide-react";
import { useProfile, useTodayMission, useTraining } from "@/hooks/useForge";
import { useAuth } from "@/hooks/useAuth";
import { ensureTodayMission } from "@/lib/actions";
import { useQueryClient } from "@tanstack/react-query";
import {
  computeStreaks,
  dayCounts,
  isSolved,
  personalizedInsight,
  readiness,
  topicStats,
  weakAreas,
} from "@/lib/metrics";
import { DIFFICULTY_CLASS, quoteForDate } from "@/lib/constants";
import { greeting } from "@/lib/metrics";
import { Heatmap } from "@/components/Heatmap";
import { EmptyState } from "@/components/AppShell";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: pl } = useProfile();
  const { data: training, isLoading: tl } = useTraining();
  const { data: mission } = useTodayMission();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Onboarding gate
  useEffect(() => {
    if (profile && !profile.onboarded) navigate({ to: "/onboarding" });
  }, [profile, navigate]);

  // Auto-create today's mission
  useEffect(() => {
    if (!user || !training || mission !== null || mission === undefined) return;
    ensureTodayMission({
      userId: user.id,
      target: profile?.daily_target ?? 3,
      attempts: training.attempts,
      reviews: training.reviews,
      mistakes: training.mistakes,
    })
      .then(() => queryClient.invalidateQueries({ queryKey: ["mission"] }))
      .catch(() => undefined);
  }, [user, training, mission, profile, queryClient]);

  if (pl || tl || !training) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { attempts, reviews, mistakes } = training;
  const solved = attempts.filter(isSolved);
  const streaks = computeStreaks(attempts);
  const target = profile?.daily_target ?? 3;
  const score = readiness(attempts, reviews, mistakes, target);
  const topics = topicStats(attempts).slice(0, 7);
  const weak = weakAreas(attempts, mistakes).slice(0, 2);
  const counts = dayCounts(attempts);
  const items = (mission?.items ?? []).slice().sort((a, b) => a.slot - b.slot);
  const doneToday = items.filter((i) => i.completed).length;
  const accuracy = attempts.length ? Math.round((solved.length / attempts.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="panel forge-glow p-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          {greeting()}, {profile?.name || "there"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {personalizedInsight(attempts, reviews, target)}
        </p>
        <p className="mt-3 border-l-2 border-primary/60 pl-3 font-mono text-xs text-muted-foreground">
          {quoteForDate(new Date())}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today" value={`${doneToday}/${target}`} sub={`${Math.round((doneToday / target) * 100)}% of today's target`} />
        <Stat
          label="Total"
          value={`${solved.length}`}
          sub={`${attempts.length} attempts · ${accuracy}% accuracy`}
        />
        <Stat
          label="Streak"
          value={`${streaks.current}`}
          sub={`longest ${streaks.longest} days`}
          icon={<Flame className="size-4 text-primary" />}
        />
        <Stat
          label="OA Readiness"
          value={`${score.total}`}
          sub={`weakest: ${score.weakest}`}
          icon={<TrendingUp className="size-4 text-primary" />}
        />
      </div>

      <section className="panel p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Today's Mission
          </h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/mission">
              Open <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>
        <Progress value={(doneToday / Math.max(target, 1)) * 100} className="mb-5 h-1.5" />
        {items.length === 0 ? (
          <EmptyState
            title="No mission generated yet"
            body="Your grind starts here. Add your first problem and make today Day 1."
            action={
              <Button asChild>
                <Link to="/problems">Add a problem</Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-background/40 p-3"
              >
                <span className="font-mono text-xs text-muted-foreground">#{item.slot}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{item.problem?.title}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.problem?.platform}</span>
                    <span>·</span>
                    <span>{item.problem?.topic}</span>
                    {item.problem?.pattern && (
                      <>
                        <span>·</span>
                        <span>{item.problem.pattern}</span>
                      </>
                    )}
                    <span>·</span>
                    <span>~{item.problem?.estimated_time} min</span>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-[11px]",
                    DIFFICULTY_CLASS[item.problem?.difficulty ?? "Easy"],
                  )}
                >
                  {item.problem?.difficulty}
                </span>
                {item.problem?.url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={item.problem.url} target="_blank" rel="noreferrer">
                      Solve <ExternalLink className="size-3" />
                    </a>
                  </Button>
                )}
                <Button asChild size="sm" variant={item.completed ? "secondary" : "default"}>
                  <Link to="/problems/$id" params={{ id: item.problem_id }}>
                    {item.completed ? "Logged" : "Log result"}
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Activity
        </h2>
        <Heatmap counts={counts} />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Topic Mastery
          </h2>
          {topics.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Log a few attempts and topic mastery appears here.
            </p>
          ) : (
            <ul className="space-y-3">
              {topics.map((t) => (
                <li key={t.topic}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span>{t.topic}</span>
                    <span className="font-mono text-muted-foreground">{t.mastery}%</span>
                  </div>
                  <Progress value={t.mastery} className="h-1.5" />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Weak Areas
          </h2>
          {weak.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Not enough signal yet. Weak areas appear after a few attempts per topic.
            </p>
          ) : (
            <ul className="space-y-4">
              {weak.map((w) => (
                <li key={w.topic} className="rounded-md border border-border p-3">
                  <div className="text-sm font-medium">{w.topic}</div>
                  <ul className="mt-1.5 list-inside list-disc text-xs text-muted-foreground">
                    {w.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-primary">{w.recommendation}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent Activity
        </h2>
        {attempts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing logged yet.</p>
        ) : (
          <ul className="divide-y divide-border text-sm">
            {attempts.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate">{a.problem?.title}</span>
                <span
                  className={cn(
                    "shrink-0 font-mono text-xs",
                    isSolved(a) ? "text-success" : "text-destructive",
                  )}
                >
                  {isSolved(a) ? "solved" : "failed"} · {a.solved_on}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="panel p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon}
      </div>
      <div className="mt-2 font-mono text-3xl font-semibold tracking-tight">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
    </div>
  );
}
