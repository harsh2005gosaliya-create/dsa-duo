import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import {
  CheckCircle2,
  ExternalLink,
  Filter,
  Plus,
  Search,
  Send,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDuo } from "@/hooks/useForge";
import { shareProblem } from "@/lib/social";
import {
  DIFFICULTIES,
  DIFFICULTY_CLASS,
  PLATFORMS,
  TOPICS,
  todayISO,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProblemAddDialog } from "@/components/ProblemAddDialog";

export const Route = createFileRoute("/_authenticated/problems/")({
  component: ProblemsPage,
});

function ProblemsPage() {
  const { user } = useAuth();
  const { data: duoData } = useDuo();
  const queryClient = useQueryClient();

  const friendId = duoData?.friendId;
  const friendName = duoData?.friendProfile?.name || duoData?.friendProfile?.username || "Partner";

  // Filter states
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");

  // Fetch all problems
  const { data: problems = [], isLoading: probLoading } = useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problems")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch user submissions and friend submissions to show status
  const { data: userSubmissions = [] } = useQuery({
    queryKey: ["all-submissions", user?.id, friendId],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("submissions")
        .select("id, user_id, problem_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  // Fetch today's shares to know what is already shared today
  const { data: todayShares = [] } = useQuery({
    queryKey: ["today-shares", user?.id, todayISO()],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_problems")
        .select("id, problem_id")
        .eq("share_date", todayISO())
        .or(`from_user.eq.${user!.id},to_user.eq.${user!.id}`);
      if (error) throw error;
      return data ?? [];
    },
  });

  const sharedTodayIds = new Set(todayShares.map((s) => s.problem_id));
  const mySolvedIds = new Set(
    userSubmissions.filter((s) => s.user_id === user?.id).map((s) => s.problem_id)
  );
  const friendSolvedIds = new Set(
    userSubmissions.filter((s) => s.user_id === friendId).map((s) => s.problem_id)
  );

  // Filtered problems list
  const filteredProblems = useMemo(() => {
    return problems.filter((p) => {
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (difficultyFilter !== "all" && p.difficulty !== difficultyFilter) return false;
      if (topicFilter !== "all" && p.topic !== topicFilter) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesTopic = p.topic.toLowerCase().includes(query);
        const matchesPattern = p.pattern?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesTopic && !matchesPattern) return false;
      }
      return true;
    });
  }, [problems, platformFilter, difficultyFilter, topicFilter, search]);

  const handleShareProblem = async (problemId: string, problemTitle: string) => {
    if (!user || !friendId) return;
    try {
      await shareProblem({
        fromUser: user.id,
        toUser: friendId,
        problemId,
        shareDate: todayISO(),
      });
      await queryClient.invalidateQueries({ queryKey: ["today-shares"] });
      await queryClient.invalidateQueries({ queryKey: ["shares"] });
      await queryClient.invalidateQueries({ queryKey: ["mission"] });
      toast.success(`Shared "${problemTitle}" with ${friendName} for today's mission!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to share.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Problem Library"
        description="All practice problems curated and added by you and your partner. Add new problems via URL or assign existing ones to today's mission."
        action={<ProblemAddDialog defaultShareWithDuo={!!friendId} />}
      />

      {/* SEARCH AND FILTERS BAR */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder="Search title, topic, pattern..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            {/* Platform Filter */}
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Difficulty Filter */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Difficulties</SelectItem>
                {DIFFICULTIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Topic Filter */}
            <Select value={topicFilter} onValueChange={setTopicFilter}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Topic" />
              </SelectTrigger>
              <SelectContent className="max-h-56">
                <SelectItem value="all">All Topics</SelectItem>
                {TOPICS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* PROBLEMS LIST */}
      {probLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : filteredProblems.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <h3 className="text-base font-semibold">No problems found</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
            {problems.length === 0
              ? "Your library is empty. Paste a LeetCode or GFG link above to add your first question."
              : "No problems match your current search and filter criteria."}
          </p>
          <div className="mt-4 flex justify-center">
            <ProblemAddDialog defaultShareWithDuo={!!friendId} />
          </div>
        </Card>
      ) : (
        <div className="space-y-2.5">
          <div className="text-xs font-mono text-muted-foreground px-1">
            Showing {filteredProblems.length} problem{filteredProblems.length !== 1 ? "s" : ""}
          </div>

          {filteredProblems.map((prob) => {
            const isMineSolved = mySolvedIds.has(prob.id);
            const isFriendSolved = friendSolvedIds.has(prob.id);
            const isSharedToday = sharedTodayIds.has(prob.id);

            return (
              <Card
                key={prob.id}
                className="border-border hover:border-border/80 transition-colors"
              >
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            "rounded border px-1.5 py-0.5 text-[10px] font-medium font-mono",
                            DIFFICULTY_CLASS[prob.difficulty ?? "Easy"]
                          )}
                        >
                          {prob.difficulty}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground font-medium">
                          {prob.platform}
                        </span>
                        <span className="text-xs text-muted-foreground">{prob.topic}</span>
                        {prob.pattern && (
                          <span className="text-xs text-muted-foreground">· {prob.pattern}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Link
                          to="/problems/$id"
                          params={{ id: prob.id }}
                          className="text-sm font-semibold hover:text-primary transition-colors truncate"
                        >
                          {prob.title}
                        </Link>
                        {prob.url && (
                          <a
                            href={prob.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground hover:text-foreground"
                            title="Open external problem link"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>

                      {/* Status Badges */}
                      <div className="flex items-center gap-3 pt-0.5 text-[11px] font-mono">
                        <span className="flex items-center gap-1">
                          You:
                          {isMineSolved ? (
                            <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                              <CheckCircle2 className="size-3" /> Solved
                            </span>
                          ) : (
                            <span className="text-muted-foreground">Unsolved</span>
                          )}
                        </span>

                        {friendId && (
                          <span className="flex items-center gap-1">
                            {friendName}:
                            {isFriendSolved ? (
                              <span className="text-emerald-500 font-semibold flex items-center gap-0.5">
                                <CheckCircle2 className="size-3" /> Solved
                              </span>
                            ) : (
                              <span className="text-muted-foreground">Unsolved</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {friendId && (
                        <Button
                          size="sm"
                          variant={isSharedToday ? "secondary" : "outline"}
                          disabled={isSharedToday}
                          onClick={() => handleShareProblem(prob.id, prob.title)}
                          className="h-8 text-xs gap-1.5"
                        >
                          <Send className="size-3" />
                          {isSharedToday ? "In Today's Mission" : "Assign for Today"}
                        </Button>
                      )}

                      <Button asChild size="sm" variant="default" className="h-8 text-xs">
                        <Link to="/problems/$id" params={{ id: prob.id }}>
                          {isMineSolved ? "View / Compare" : "Solve"}
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
