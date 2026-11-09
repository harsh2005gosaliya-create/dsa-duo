import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  History,
  Plus,
  Search,
  Send,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDuo } from "@/hooks/useForge";
import { useShares } from "@/hooks/useSocial";
import { DIFFICULTY_CLASS, todayISO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProblemAddDialog } from "@/components/ProblemAddDialog";

export const Route = createFileRoute("/_authenticated/problems/")({
  component: PastMissionsPage,
});

function PastMissionsPage() {
  const { user } = useAuth();
  const { data: duoData } = useDuo();
  const { data: sharesData, isLoading: sharesLoading } = useShares();

  const friend = duoData?.friendProfile;
  const friendId = duoData?.friendId;
  const friendName = friend?.name || friend?.username || "Partner";

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const allShares = sharesData?.all ?? [];

  // Extract all unique problem IDs
  const problemIds = Array.from(new Set(allShares.map((s) => s.problem_id).filter(Boolean)));

  // Fetch all submissions for these problems to compute completion status
  const { data: submissions = [] } = useQuery({
    queryKey: ["history-submissions", problemIds, user?.id, friendId],
    enabled: problemIds.length > 0 && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, user_id, problem_id, created_at")
        .in("problem_id", problemIds);
      if (error) throw error;
      return data ?? [];
    },
  });

  const isSolvedByMe = (probId: string) =>
    submissions.some((s) => s.problem_id === probId && s.user_id === user?.id);

  const isSolvedByFriend = (probId: string) =>
    submissions.some((s) => s.problem_id === probId && s.user_id === friendId);

  // Group problems by date
  const groupedByDate = useMemo(() => {
    const groups = new Map<string, typeof allShares>();

    const filtered = allShares.filter((item) => {
      const p = item.problem;
      if (!p) return false;

      // Status filter
      const mineSolved = isSolvedByMe(p.id);
      const friendSolved = isSolvedByFriend(p.id);

      if (statusFilter === "both_solved" && (!mineSolved || !friendSolved)) return false;
      if (statusFilter === "pending_mine" && mineSolved) return false;
      if (statusFilter === "pending_friend" && friendSolved) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesTopic = p.topic.toLowerCase().includes(q);
        const matchesMsg = item.message?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesTopic && !matchesMsg) return false;
      }
      return true;
    });

    filtered.forEach((item) => {
      const date = item.share_date || "Unknown";
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date)!.push(item);
    });

    // Sort dates descending
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [allShares, statusFilter, search, submissions]);

  const today = todayISO();

  const formatDateLabel = (dateStr: string) => {
    if (dateStr === today) return "Today's Mission";
    const d = new Date(dateStr + "T00:00:00Z");
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    if (dateStr === yesterday.toISOString().slice(0, 10)) return "Yesterday";
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Past Missions & History"
        description="Every mutual practice question shared between you and your partner, archived by date with completion history."
        action={
          <div className="flex gap-2">
            <ProblemAddDialog
              defaultShareWithDuo={!!friendId}
              trigger={
                <Button size="sm" className="gap-2">
                  <Plus className="size-4" />
                  Add & Share Problem
                </Button>
              }
            />
          </div>
        }
      />

      {/* FILTER & SEARCH BAR */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="relative sm:col-span-2">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search previous problems, topics, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Completion Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Missions</SelectItem>
                <SelectItem value="both_solved">Conquered by Both</SelectItem>
                <SelectItem value="pending_mine">Needs My Solution</SelectItem>
                {friendId && (
                  <SelectItem value="pending_friend">Waiting on {friendName}</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* MISSIONS ARCHIVE FEED */}
      {sharesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : groupedByDate.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <History className="size-6" />
          </div>
          <h3 className="text-base font-semibold">No past missions found</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {allShares.length === 0
              ? "You haven't shared any problems yet. Start by sharing today's mission with your friend."
              : "No missions match your search or filter."}
          </p>
          <div className="mt-4 flex justify-center">
            <ProblemAddDialog
              defaultShareWithDuo={!!friendId}
              trigger={
                <Button size="sm" className="gap-1.5">
                  <Plus className="size-4" /> Share a Problem
                </Button>
              }
            />
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(([date, items]) => {
            const totalOnDate = items.length;
            const mySolved = items.filter((i) => isSolvedByMe(i.problem_id)).length;
            const friendSolved = items.filter((i) => isSolvedByFriend(i.problem_id)).length;
            const allSolved = totalOnDate > 0 && mySolved === totalOnDate && friendSolved === totalOnDate;

            return (
              <div key={date} className="space-y-3">
                {/* DATE HEADER */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-2 px-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-primary" />
                    <h2 className="text-sm font-bold tracking-tight">
                      {formatDateLabel(date)}
                    </h2>
                    <span className="text-xs font-mono text-muted-foreground">({date})</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-muted-foreground">
                      You: {mySolved}/{totalOnDate}
                    </span>
                    {friendId && (
                      <span className="text-muted-foreground">
                        {friendName}: {friendSolved}/{totalOnDate}
                      </span>
                    )}
                    {allSolved && (
                      <Badge variant="secondary" className="text-emerald-500 bg-emerald-500/10 border-emerald-500/20 text-[10px] gap-1">
                        <Trophy className="size-3" /> Both Solved
                      </Badge>
                    )}
                  </div>
                </div>

                {/* PROBLEMS FOR THIS DATE */}
                <div className="space-y-2.5">
                  {items.map((item) => {
                    const p = item.problem;
                    if (!p) return null;

                    const mineDone = isSolvedByMe(p.id);
                    const friendDone = isSolvedByFriend(p.id);
                    const isFromFriend = item.to_user === user?.id;
                    const isBonus =
                      item.message?.includes("[Extra Challenge]") ||
                      item.message?.includes("[Bonus]") ||
                      p.tags?.includes("Bonus");

                    return (
                      <Card
                        key={item.id}
                        className={cn(
                          "border transition-colors",
                          isBonus ? "border-amber-500/40 bg-amber-500/5" : "border-border"
                        )}
                      >
                        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="min-w-0 flex-1 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isBonus && (
                                <Badge className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-[10px] gap-1">
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
                              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                                {p.platform}
                              </span>
                              <span className="text-xs text-muted-foreground">{p.topic}</span>
                              <Badge variant="outline" className="text-[10px]">
                                {isFromFriend ? `From ${friendName}` : "Sent by you"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-2">
                              <Link
                                to="/problems/$id"
                                params={{ id: p.id }}
                                className="text-sm font-semibold hover:text-primary transition-colors truncate"
                              >
                                {p.title}
                              </Link>
                              {p.url && (
                                <a
                                  href={p.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-muted-foreground hover:text-foreground"
                                  title="Open external problem link"
                                >
                                  <ExternalLink className="size-3" />
                                </a>
                              )}
                            </div>

                            {item.message && (
                              <p className="text-xs text-muted-foreground italic border-l-2 border-primary/40 pl-2">
                                "{item.message.replace(/^\[Extra Challenge\]\s*/, "")}"
                              </p>
                            )}
                          </div>

                          {/* Dual Status & Action */}
                          <div className="flex items-center gap-3 text-xs font-mono">
                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">You:</span>
                              {mineDone ? (
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
                                {friendDone ? (
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

                            <Button asChild size="sm" variant={mineDone ? "secondary" : "default"} className="h-8 text-xs">
                              <Link to="/problems/$id" params={{ id: p.id }}>
                                {mineDone ? "Review & Compare" : "Solve"}
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
