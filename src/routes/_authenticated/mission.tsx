import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Flame,
  Plus,
  Send,
  Sparkles,
  Trophy,
  Users,
  Zap,
  ArrowRight,
  Code2,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDuo, useProfile } from "@/hooks/useForge";
import { useShares } from "@/hooks/useSocial";
import { sendSignal } from "@/lib/social";
import { DIFFICULTY_CLASS, todayISO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ProblemAddDialog } from "@/components/ProblemAddDialog";

export const Route = createFileRoute("/_authenticated/mission")({
  component: MissionPage,
});

function MissionPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: duoData, isLoading: duoLoading } = useDuo();
  const { data: sharesData, isLoading: sharesLoading } = useShares();
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());

  const friend = duoData?.friendProfile;
  const friendId = duoData?.friendId;
  const friendName = friend?.name || friend?.username || "Partner";

  // Filter shares for selected date
  const allShares = sharesData?.all ?? [];
  const dateShares = allShares.filter((s) => s.share_date === selectedDate);
  const sentByFriend = dateShares.filter((s) => s.to_user === user?.id);
  const sharedByMe = dateShares.filter((s) => s.from_user === user?.id);

  // Collect all problem IDs in today's mission
  const problemIds = Array.from(
    new Set(dateShares.map((s) => s.problem_id).filter(Boolean))
  );

  // Fetch submissions for these problems to compute real-time solve status
  const { data: submissions = [] } = useQuery({
    queryKey: ["mission-submissions", problemIds, user?.id, friendId],
    enabled: problemIds.length > 0 && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, user_id, problem_id, language, created_at")
        .in("problem_id", problemIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isSolvedByMe = (probId: string) =>
    submissions.some((s) => s.problem_id === probId && s.user_id === user?.id);

  const isSolvedByFriend = (probId: string) =>
    submissions.some((s) => s.problem_id === probId && s.user_id === friendId);

  // Dynamic count of problems (no hardcoded 3)
  const totalMissionProblems = dateShares.length;
  const mySolvedCount = dateShares.filter((s) => isSolvedByMe(s.problem_id)).length;
  const friendSolvedCount = dateShares.filter((s) => isSolvedByFriend(s.problem_id)).length;
  const allMutualSolved =
    totalMissionProblems > 0 &&
    mySolvedCount === totalMissionProblems &&
    friendSolvedCount === totalMissionProblems;

  const isToday = selectedDate === todayISO();

  const handleNudge = async (probTitle: string) => {
    if (!user || !friendId) return;
    try {
      await sendSignal(user.id, friendId, "nudge", `🔥 Time to solve "${probTitle}" for today's mission!`);
      toast.success(`Nudge sent to ${friendName}!`);
    } catch {
      toast.error("Could not send nudge.");
    }
  };

  if (duoLoading || sharesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  // Not paired yet prompt
  if (!friendId) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Daily Duo Mission"
          description="Your daily mission consists exclusively of questions you and your study partner share with each other."
        />
        <Card className="border-dashed border-border p-8 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Users className="size-6" />
          </div>
          <h3 className="text-lg font-semibold">Pair up to unlock Daily Missions</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Daily missions in DSA Forge are 100% peer-driven. Search for your friend to establish your duo partnership, then share daily problems with each other.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Button asChild>
              <Link to="/duo">Go to Duo Page</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER WITH DYNAMIC ACTIONS */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Mission</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Mutual grind with <span className="font-semibold text-foreground">@{friend?.username}</span>.
            Solve, record intuition, and compare implementations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-auto font-mono text-xs h-9 bg-card"
          />

          <ProblemAddDialog
            defaultShareWithDuo={true}
            defaultBonus={false}
            targetDate={selectedDate}
            trigger={
              <Button size="sm" className="gap-1.5 h-9 text-xs">
                <Plus className="size-4" />
                Add Problem
              </Button>
            }
          />

          <ProblemAddDialog
            defaultShareWithDuo={true}
            defaultBonus={true}
            targetDate={selectedDate}
            trigger={
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 h-9 text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
              >
                <Sparkles className="size-3.5" />
                + Extra Problem
              </Button>
            }
          />
        </div>
      </div>

      {/* MUTUAL MISSION STATUS BANNER */}
      <Card className="border-border bg-gradient-to-r from-card via-card to-primary/5">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-lg bg-primary text-primary-foreground shrink-0">
                <Flame className="size-5" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {isToday ? "Today's Mission Status" : `Mission for ${selectedDate}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {totalMissionProblems === 0
                    ? "No questions assigned yet for this date. Add one or pick an extra challenge above!"
                    : `${totalMissionProblems} question${totalMissionProblems > 1 ? "s" : ""} on the docket.`}
                </div>
              </div>
            </div>

            {totalMissionProblems > 0 && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">You:</span>
                  <Badge variant={mySolvedCount === totalMissionProblems ? "default" : "outline"}>
                    {mySolvedCount}/{totalMissionProblems} Solved
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">{friendName}:</span>
                  <Badge variant={friendSolvedCount === totalMissionProblems ? "default" : "outline"}>
                    {friendSolvedCount}/{totalMissionProblems} Solved
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {allMutualSolved && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-500 text-xs font-medium">
              <Trophy className="size-4 shrink-0" />
              <span>
                Awesome teamwork! Both you and {friendName} have finished every mission question for this date!
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* TWO SECTIONS: SENT BY FRIEND & SHARED BY ME */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SENT BY FRIEND */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-primary" />
              <h2 className="text-sm sm:text-base font-semibold">Sent by {friendName}</h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {sentByFriend.length} question{sentByFriend.length !== 1 ? "s" : ""}
            </span>
          </div>

          {sentByFriend.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-xs text-muted-foreground space-y-3">
              <div>{friendName} hasn't assigned you any questions for this date yet.</div>
              <Button asChild variant="outline" size="sm" className="text-xs">
                <Link to="/duo">Nudge {friendName} on Duo</Link>
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {sentByFriend.map((item) => (
                <MissionProblemCard
                  key={item.id}
                  item={item}
                  isMineSolved={isSolvedByMe(item.problem_id)}
                  isFriendSolved={isSolvedByFriend(item.problem_id)}
                  friendName={friendName}
                  onNudge={() => handleNudge(item.problem?.title || "problem")}
                />
              ))}
            </div>
          )}
        </div>

        {/* SHARED BY ME */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="size-2 rounded-full bg-blue-500" />
              <h2 className="text-sm sm:text-base font-semibold">Shared by Me</h2>
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              {sharedByMe.length} question{sharedByMe.length !== 1 ? "s" : ""}
            </span>
          </div>

          {sharedByMe.length === 0 ? (
            <Card className="border-dashed p-8 text-center text-xs text-muted-foreground space-y-3">
              <div>You haven't assigned any questions to {friendName} for this date.</div>
              <div>
                <ProblemAddDialog
                  defaultShareWithDuo={true}
                  targetDate={selectedDate}
                  trigger={
                    <Button size="sm" className="gap-1.5 text-xs">
                      <Plus className="size-3.5" />
                      Pick & Share Question
                    </Button>
                  }
                />
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {sharedByMe.map((item) => (
                <MissionProblemCard
                  key={item.id}
                  item={item}
                  isMineSolved={isSolvedByMe(item.problem_id)}
                  isFriendSolved={isSolvedByFriend(item.problem_id)}
                  friendName={friendName}
                  onNudge={() => handleNudge(item.problem?.title || "problem")}
                />
              ))}

              <div className="pt-1">
                <ProblemAddDialog
                  defaultShareWithDuo={true}
                  targetDate={selectedDate}
                  trigger={
                    <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground border border-dashed border-border hover:text-foreground">
                      <Plus className="size-3.5 mr-1" /> Add Another Problem for {friendName}
                    </Button>
                  }
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MissionProblemCard({
  item,
  isMineSolved,
  isFriendSolved,
  friendName,
  onNudge,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  item: any;
  isMineSolved: boolean;
  isFriendSolved: boolean;
  friendName: string;
  onNudge: () => void;
}) {
  const p = item.problem;
  if (!p) return null;

  const isBonus =
    item.message?.includes("[Extra Challenge]") ||
    item.message?.includes("[Bonus]") ||
    p.tags?.includes("Bonus");

  const cleanMessage = item.message?.replace(/^\[Extra Challenge\]\s*/, "");

  return (
    <Card
      className={cn(
        "border transition-colors",
        isBonus ? "border-amber-500/30 bg-amber-500/[0.03]" : "border-border"
      )}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
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
              <span className="text-[11px] text-muted-foreground">{p.topic}</span>
              {p.pattern && (
                <span className="text-[11px] text-muted-foreground">· {p.pattern}</span>
              )}
            </div>

            <h3 className="mt-1.5 text-sm font-semibold truncate hover:text-primary transition-colors">
              <Link to="/problems/$id" params={{ id: p.id }}>
                {p.title}
              </Link>
            </h3>

            {cleanMessage && (
              <p className="mt-1 text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                "{cleanMessage}"
              </p>
            )}
          </div>
        </div>

        {/* REAL-TIME DUAL STATUS BADGES & MOBILE FRIENDLY ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-center gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">You:</span>
              {isMineSolved ? (
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle2 className="size-3.5" /> Solved
                </span>
              ) : (
                <span className="flex items-center gap-1 text-amber-500">
                  <Clock className="size-3.5" /> Pending
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">{friendName}:</span>
              {isFriendSolved ? (
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle2 className="size-3.5" /> Solved
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3.5" /> Pending
                  </span>
                  <button
                    onClick={onNudge}
                    title={`Nudge ${friendName}`}
                    className="text-amber-500 hover:text-amber-400 p-0.5 rounded transition-colors"
                  >
                    <Zap className="size-3 fill-amber-500" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {p.url && (
              <Button asChild variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <a href={p.url} target="_blank" rel="noreferrer" title="Open source problem">
                  <ExternalLink className="size-3" />
                </a>
              </Button>
            )}

            <Button asChild size="sm" variant={isMineSolved ? "secondary" : "default"} className="h-7 text-xs gap-1">
              <Link to="/problems/$id" params={{ id: p.id }}>
                {isMineSolved ? "View / Compare" : "Solve"}
                <ArrowRight className="size-3" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
