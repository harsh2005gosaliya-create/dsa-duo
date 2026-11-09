import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Plus,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useTraining, useDuo } from "@/hooks/useForge";
import { useShares } from "@/hooks/useSocial";
import { useAuth } from "@/hooks/useAuth";
import {
  computeStreaks,
  dayCounts,
  greeting,
  isSolved,
  topicStats,
} from "@/lib/metrics";
import { DIFFICULTY_CLASS, quoteForDate, todayISO } from "@/lib/constants";
import { Heatmap } from "@/components/Heatmap";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ProblemAddDialog } from "@/components/ProblemAddDialog";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const { data: profile, isLoading: pl } = useProfile();
  const { data: training, isLoading: tl } = useTraining();
  const { data: duoData, isLoading: dl } = useDuo();
  const { data: sharesData, isLoading: sl } = useShares();
  const navigate = useNavigate();

  // Onboarding gate: redirect if not onboarded yet
  useEffect(() => {
    if (profile && !profile.onboarded) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [profile, navigate]);

  const today = todayISO();
  const friend = duoData?.friendProfile;
  const friendId = duoData?.friendId;
  const friendName = friend?.name || friend?.username || "Partner";

  // Today's mutual mission problems
  const allShares = sharesData?.all ?? [];
  const todayShares = allShares.filter((s) => s.share_date === today);

  const todayProblemIds = Array.from(
    new Set(todayShares.map((s) => s.problem_id).filter(Boolean))
  );

  // Real-time submissions check for today's mission
  const { data: todaySubmissions = [] } = useQuery({
    queryKey: ["dashboard-today-subs", todayProblemIds, user?.id, friendId],
    enabled: todayProblemIds.length > 0 && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, user_id, problem_id")
        .in("problem_id", todayProblemIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isSolvedByMe = (probId: string) =>
    todaySubmissions.some((s) => s.problem_id === probId && s.user_id === user?.id);

  const isSolvedByFriend = (probId: string) =>
    todaySubmissions.some((s) => s.problem_id === probId && s.user_id === friendId);

  if (pl || tl || dl || sl || !training) {
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

  const { attempts } = training;
  const solved = attempts.filter(isSolved);
  const streaks = computeStreaks(attempts);
  const friendAttempts = duoData?.friendAttempts ?? [];
  const friendStreaks = computeStreaks(friendAttempts);
  const topics = topicStats(attempts).slice(0, 6);
  const counts = dayCounts(attempts);

  const totalMission = todayShares.length;
  const myMissionSolved = todayShares.filter((s) => isSolvedByMe(s.problem_id)).length;
  const friendMissionSolved = todayShares.filter((s) => isSolvedByFriend(s.problem_id)).length;
  const missionProgress = totalMission > 0 ? Math.round((myMissionSolved / totalMission) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* WELCOME / DUO STATUS BANNER */}
      <div className="panel forge-glow p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {greeting()}, {profile?.name || profile?.username || "there"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {friendId ? (
                <>
                  Paired with <span className="font-semibold text-foreground">@{friend?.username}</span> ·{" "}
                  {friend?.preferred_language || "C++"}
                </>
              ) : (
                "You haven't paired with a duo partner yet. Pair on the Duo page to unlock mutual daily missions."
              )}
            </p>
            <p className="mt-3 border-l-2 border-primary/60 pl-3 font-mono text-xs text-muted-foreground">
              {quoteForDate(new Date())}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ProblemAddDialog
              defaultShareWithDuo={!!friendId}
              defaultBonus={false}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-4" />
                  Add Problem
                </Button>
              }
            />
            <ProblemAddDialog
              defaultShareWithDuo={!!friendId}
              defaultBonus={true}
              trigger={
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                >
                  <Sparkles className="size-3.5" />
                  + Extra Problem
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* REAL STATS ROW */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="Your Streak"
          value={`${streaks.current} d`}
          sub={`Longest: ${streaks.longest} consecutive days`}
          icon={<Flame className="size-4 text-primary" />}
        />
        <Stat
          label="Partner's Streak"
          value={friendId ? `${friendStreaks.current} d` : "—"}
          sub={friendId ? `Longest: ${friendStreaks.longest} days` : "Pair on Duo"}
          icon={<Flame className="size-4 text-amber-500" />}
        />
        <Stat
          label="Today's Mission"
          value={totalMission > 0 ? `${myMissionSolved}/${totalMission}` : "0"}
          sub={totalMission > 0 ? `${missionProgress}% completed` : "No questions assigned"}
          icon={<CheckCircle2 className="size-4 text-emerald-500" />}
        />
        <Stat
          label="Total Problems Solved"
          value={`${solved.length}`}
          sub={`${attempts.length} total verified attempts`}
          icon={<Trophy className="size-4 text-primary" />}
        />
      </div>

      {/* TODAY'S MUTUAL MISSION SECTION */}
      <section className="panel p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Today's Mutual Mission
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Problems exchanged between you and {friendId ? `@${friend?.username}` : "your partner"} for today.
            </p>
          </div>

          <Button asChild variant="ghost" size="sm">
            <Link to="/mission">
              Full Mission <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {totalMission > 0 && (
          <Progress value={missionProgress} className="h-1.5" />
        )}

        {totalMission === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <h3 className="text-sm font-medium">No mutual mission problems for today</h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
              Paste a LeetCode or GFG link to share today's mission with {friendName}.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <ProblemAddDialog
                defaultShareWithDuo={!!friendId}
                trigger={
                  <Button size="sm" className="gap-1.5">
                    <Plus className="size-3.5" />
                    Share a Problem for Today
                  </Button>
                }
              />
              {!friendId && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/duo">Pair with Friend</Link>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {todayShares.map((item) => {
              const p = item.problem;
              if (!p) return null;
              const mineSolved = isSolvedByMe(p.id);
              const partnerSolved = isSolvedByFriend(p.id);
              const isFromFriend = item.to_user === user?.id;
              const isBonus =
                item.message?.includes("[Extra Challenge]") ||
                item.message?.includes("[Bonus]") ||
                p.tags?.includes("Bonus");

              return (
                <li
                  key={item.id}
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-3 rounded-md border p-3",
                    isBonus ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-border bg-card/60"
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isBonus && (
                        <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] gap-1 font-semibold">
                          <Sparkles className="size-3" /> Extra Challenge
                        </Badge>
                      )}
                      <span
                        className={cn(
                          "rounded border px-1.5 py-0.5 text-[10px] font-medium font-mono",
                          DIFFICULTY_CLASS[p.difficulty ?? "Easy"]
                        )}
                      >
                        {p.difficulty}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                        {p.platform}
                      </span>
                      <span className="text-xs text-muted-foreground">{p.topic}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {isFromFriend ? `From ${friendName}` : "Sent by you"}
                      </Badge>
                    </div>

                    <div className="mt-1 flex items-center gap-2">
                      <Link
                        to="/problems/$id"
                        params={{ id: p.id }}
                        className="text-sm font-semibold truncate hover:text-primary transition-colors"
                      >
                        {p.title}
                      </Link>
                      {p.url && (
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                          title="Solve on external site"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Dual Completion Status */}
                  <div className="flex items-center gap-3 text-xs font-mono">
                    <div className="flex items-center gap-1">
                      <span className="text-muted-foreground">You:</span>
                      {mineSolved ? (
                        <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                          <CheckCircle2 className="size-3.5" /> Solved
                        </span>
                      ) : (
                        <span className="text-muted-foreground flex items-center gap-0.5">
                          <Clock className="size-3.5" /> Pending
                        </span>
                      )}
                    </div>

                    {friendId && (
                      <div className="flex items-center gap-1">
                        <span className="text-muted-foreground">{friendName}:</span>
                        {partnerSolved ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                            <CheckCircle2 className="size-3.5" /> Solved
                          </span>
                        ) : (
                          <span className="text-muted-foreground flex items-center gap-0.5">
                            <Clock className="size-3.5" /> Pending
                          </span>
                        )}
                      </div>
                    )}

                    <Button asChild size="sm" variant={mineSolved ? "secondary" : "default"} className="h-7 text-xs">
                      <Link to="/problems/$id" params={{ id: p.id }}>
                        {mineSolved ? "View Code" : "Solve"}
                      </Link>
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* REAL ACTIVITY HEATMAP */}
      <section className="panel p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Submission Activity
            </h2>
            <p className="text-xs text-muted-foreground">
              Computed 100% from your real problem attempts and code submissions.
            </p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {streaks.activeDays} active day{streaks.activeDays !== 1 ? "s" : ""}
          </span>
        </div>
        <Heatmap counts={counts} />
      </section>

      {/* TOPICS SOLVED & RECENT SUBMISSIONS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Topics Breakdown */}
        <section className="panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Topics Practiced
          </h2>
          {topics.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              Your topic breakdown will display here as you log and solve problems.
            </p>
          ) : (
            <ul className="space-y-3">
              {topics.map((t) => (
                <li key={t.topic}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium">{t.topic}</span>
                    <span className="font-mono text-muted-foreground">
                      {t.solved} solved / {t.attempted} attempts
                    </span>
                  </div>
                  <Progress
                    value={t.attempted > 0 ? (t.solved / t.attempted) * 100 : 0}
                    className="h-1.5"
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent Submissions Feed */}
        <section className="panel p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent Problem Solves
          </h2>
          {attempts.length === 0 ? (
            <p className="text-xs text-muted-foreground">No submissions logged yet.</p>
          ) : (
            <ul className="divide-y divide-border text-xs">
              {attempts.slice(0, 7).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0 flex-1 truncate">
                    <span className="font-medium">{a.problem?.title || "Problem"}</span>
                    <span className="text-muted-foreground ml-2">({a.problem?.topic})</span>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 font-mono text-[11px]",
                      isSolved(a) ? "text-emerald-500" : "text-destructive"
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
