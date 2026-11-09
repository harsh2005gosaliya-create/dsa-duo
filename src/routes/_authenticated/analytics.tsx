import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Flame,
  PieChart,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { useTraining, useDuo, useProfile } from "@/hooks/useForge";
import { computeStreaks, isSolved, topicStats } from "@/lib/metrics";
import { PageHeader } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/analytics")({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: training, isLoading: tl } = useTraining();
  const { data: duoData, isLoading: dl } = useDuo();
  const { data: profile } = useProfile();

  if (tl || dl || !training) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const { attempts } = training;
  const solvedAttempts = attempts.filter(isSolved);
  const myStreaks = computeStreaks(attempts);

  const friend = duoData?.friendProfile;
  const friendAttempts = duoData?.friendAttempts ?? [];
  const friendSolvedAttempts = friendAttempts.filter(isSolved);
  const friendStreaks = computeStreaks(friendAttempts);
  const friendName = friend?.name || friend?.username || "Partner";

  // Difficulty counts (Me)
  const myEasy = solvedAttempts.filter((a) => a.problem?.difficulty === "Easy").length;
  const myMedium = solvedAttempts.filter((a) => a.problem?.difficulty === "Medium").length;
  const myHard = solvedAttempts.filter((a) => a.problem?.difficulty === "Hard").length;

  // Difficulty counts (Partner)
  const friendEasy = friendSolvedAttempts.filter((a) => a.problem?.difficulty === "Easy").length;
  const friendMedium = friendSolvedAttempts.filter((a) => a.problem?.difficulty === "Medium").length;
  const friendHard = friendSolvedAttempts.filter((a) => a.problem?.difficulty === "Hard").length;

  // Topic stats
  const stats = topicStats(attempts);

  // Average time and confidence
  const validTimes = attempts.map((a) => a.time_taken_min).filter((t) => t > 0);
  const avgTime = validTimes.length
    ? Math.round(validTimes.reduce((s, t) => s + t, 0) / validTimes.length)
    : 0;

  const validConf = attempts.map((a) => a.confidence).filter((c) => c > 0);
  const avgConf = validConf.length
    ? (validConf.reduce((s, c) => s + c, 0) / validConf.length).toFixed(1)
    : "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Training Analytics"
        description="Authentic metrics calculated 100% from your and your duo partner's verified problem submissions."
      />

      {/* OVERVIEW CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase">
            <span>Total Solved</span>
            <Trophy className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">{solvedAttempts.length}</div>
          <p className="mt-0.5 text-xs text-muted-foreground">{attempts.length} total recorded attempts</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase">
            <span>Current Streak</span>
            <Flame className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">{myStreaks.current} days</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Longest: {myStreaks.longest} days</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase">
            <span>Average Solve Time</span>
            <Clock className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">{avgTime} min</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Across all completed problems</p>
        </Card>

        <Card className="p-4 border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground uppercase">
            <span>Average Confidence</span>
            <Target className="size-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">{avgConf} / 5</div>
          <p className="mt-0.5 text-xs text-muted-foreground">Self-evaluated retention score</p>
        </Card>
      </div>

      {/* DUO COMPARISON SECTION */}
      {friend && (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="size-4 text-primary" />
              Duo Head-to-Head Comparison
            </CardTitle>
            <CardDescription>
              Comparing your progress side-by-side with @{friend.username}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Easy */}
              <div className="rounded-lg border border-easy/20 bg-easy/5 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-easy">
                  <span>Easy Problems</span>
                  <span className="font-mono">You: {myEasy} | {friendName}: {friendEasy}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>You</span>
                    <span>{myEasy}</span>
                  </div>
                  <Progress value={Math.max(myEasy, friendEasy) > 0 ? (myEasy / Math.max(myEasy, friendEasy, 1)) * 100 : 0} className="h-1 bg-muted" />
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{friendName}</span>
                    <span>{friendEasy}</span>
                  </div>
                  <Progress value={Math.max(myEasy, friendEasy) > 0 ? (friendEasy / Math.max(myEasy, friendEasy, 1)) * 100 : 0} className="h-1 bg-muted" />
                </div>
              </div>

              {/* Medium */}
              <div className="rounded-lg border border-medium/20 bg-medium/5 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-medium">
                  <span>Medium Problems</span>
                  <span className="font-mono">You: {myMedium} | {friendName}: {friendMedium}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>You</span>
                    <span>{myMedium}</span>
                  </div>
                  <Progress value={Math.max(myMedium, friendMedium) > 0 ? (myMedium / Math.max(myMedium, friendMedium, 1)) * 100 : 0} className="h-1 bg-muted" />
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{friendName}</span>
                    <span>{friendMedium}</span>
                  </div>
                  <Progress value={Math.max(myMedium, friendMedium) > 0 ? (friendMedium / Math.max(myMedium, friendMedium, 1)) * 100 : 0} className="h-1 bg-muted" />
                </div>
              </div>

              {/* Hard */}
              <div className="rounded-lg border border-hard/20 bg-hard/5 p-4 space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold text-hard">
                  <span>Hard Problems</span>
                  <span className="font-mono">You: {myHard} | {friendName}: {friendHard}</span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-[11px] text-muted-foreground">
                    <span>You</span>
                    <span>{myHard}</span>
                  </div>
                  <Progress value={Math.max(myHard, friendHard) > 0 ? (myHard / Math.max(myHard, friendHard, 1)) * 100 : 0} className="h-1 bg-muted" />
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-1">
                    <span>{friendName}</span>
                    <span>{friendHard}</span>
                  </div>
                  <Progress value={Math.max(myHard, friendHard) > 0 ? (friendHard / Math.max(myHard, friendHard, 1)) * 100 : 0} className="h-1 bg-muted" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TOPIC BREAKDOWN TABLE */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Topic Breakdown & Accuracy</CardTitle>
          <CardDescription>
            Performance breakdown across each data structure and algorithm pattern you've attempted.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.length === 0 ? (
            <p className="text-xs text-muted-foreground py-6 text-center">
              No topic stats available yet. Log solutions to see your analytics.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="pb-2 font-medium">Topic</th>
                    <th className="pb-2 font-medium font-mono">Attempted</th>
                    <th className="pb-2 font-medium font-mono">Solved</th>
                    <th className="pb-2 font-medium font-mono">Accuracy</th>
                    <th className="pb-2 font-medium font-mono">Avg Conf</th>
                    <th className="pb-2 font-medium font-mono">Mastery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {stats.map((s) => (
                    <tr key={s.topic} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 font-medium">{s.topic}</td>
                      <td className="py-2.5 font-mono">{s.attempted}</td>
                      <td className="py-2.5 font-mono text-emerald-500 font-semibold">{s.solved}</td>
                      <td className="py-2.5 font-mono">{Math.round(s.accuracy * 100)}%</td>
                      <td className="py-2.5 font-mono">{s.avgConfidence.toFixed(1)}/5</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <Progress value={s.mastery} className="h-1.5 w-20" />
                          <span className="font-mono text-[11px] text-muted-foreground">{s.mastery}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
