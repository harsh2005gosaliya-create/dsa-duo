import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Flame,
  Lightbulb,
  MessageSquare,
  Send,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDuo, useProblem, useProfile } from "@/hooks/useForge";
import { useNames, useProblemSocial } from "@/hooks/useSocial";
import { postDiscussion, saveSubmission, sendSignal, shareProblem } from "@/lib/social";
import { DIFFICULTY_CLASS, LANGUAGES, OUTCOMES, todayISO } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/problems/$id")({
  component: ProblemDetailPage,
});

function ProblemDetailPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: problem, isLoading: probLoading } = useProblem(id);
  const { data: social, isLoading: socialLoading } = useProblemSocial(id);
  const { data: duoData } = useDuo();
  const { data: names } = useNames();
  const queryClient = useQueryClient();

  const friend = duoData?.friendProfile;
  const friendId = duoData?.friendId;
  const friendName = friend?.name || friend?.username || "Partner";

  const mySubmission = social?.mine?.[0];
  const friendSubmission = social?.friends?.[0];
  const discussions = social?.discussion ?? [];
  const shares = social?.shares ?? [];

  // Form state
  const [language, setLanguage] = useState(profile?.preferred_language || "C++");
  const [code, setCode] = useState("");
  const [intuition, setIntuition] = useState("");
  const [approach, setApproach] = useState("");
  const [timeComplexity, setTimeComplexity] = useState("O(N)");
  const [spaceComplexity, setSpaceComplexity] = useState("O(1)");
  const [outcome, setOutcome] = useState("solved_independently");
  const [timeTakenMin, setTimeTakenMin] = useState(25);
  const [confidence, setConfidence] = useState(4);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("editor");

  // Discussion state
  const [commentText, setCommentText] = useState("");
  const [postingComment, setPostingComment] = useState(false);

  // Sync form with existing submission if any
  useEffect(() => {
    if (mySubmission) {
      setLanguage(mySubmission.language || profile?.preferred_language || "C++");
      setCode(mySubmission.code || "");
      setIntuition(mySubmission.intuition || "");
      setApproach(mySubmission.approach || "");
      setTimeComplexity(mySubmission.time_complexity || "O(N)");
      setSpaceComplexity(mySubmission.space_complexity || "O(1)");
    } else if (profile?.preferred_language) {
      setLanguage(profile.preferred_language);
    }
  }, [mySubmission, profile]);

  const handleSaveSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!code.trim()) {
      toast.error("Please add your solution code.");
      return;
    }

    setSaving(true);
    try {
      // 1. Save to submissions table (for code & intuition comparison)
      await saveSubmission({
        id: mySubmission?.id,
        userId: user.id,
        problemId: id,
        language,
        code,
        intuition,
        approach,
        timeComplexity,
        spaceComplexity,
      });

      // 2. Also record an attempt into problem_attempts (for streak, heatmap, and mastery calculation)
      const { error: attemptErr } = await supabase.from("problem_attempts").insert({
        user_id: user.id,
        problem_id: id,
        outcome,
        time_taken_min: Number(timeTakenMin) || 20,
        confidence: Number(confidence) || 4,
        time_complexity: timeComplexity.trim() || null,
        space_complexity: spaceComplexity.trim() || null,
        key_idea: intuition.trim() || null,
        notes: approach.trim() || null,
        solved_on: todayISO(),
      });
      if (attemptErr) throw attemptErr;

      // 3. Update user_problem_state
      await supabase.from("user_problem_state").upsert(
        {
          user_id: user.id,
          problem_id: id,
          mastery: "solved",
          last_confidence: Number(confidence) || 4,
          last_activity_at: new Date().toISOString(),
        },
        { onConflict: "user_id,problem_id" }
      );

      // Invalidate relevant queries
      await queryClient.invalidateQueries({ queryKey: ["problem-social", id] });
      await queryClient.invalidateQueries({ queryKey: ["mission-submissions"] });
      await queryClient.invalidateQueries({ queryKey: ["training"] });
      await queryClient.invalidateQueries({ queryKey: ["mission"] });

      toast.success("Solution and intuition logged! Streak updated.");
      setActiveTab("compare");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save solution.");
    } finally {
      setSaving(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentText.trim()) return;

    setPostingComment(true);
    try {
      await postDiscussion(user.id, id, commentText.trim());
      setCommentText("");
      await queryClient.invalidateQueries({ queryKey: ["problem-social", id] });
      toast.success("Note posted to problem discussion!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post note.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleQuickShareWithDuo = async () => {
    if (!user || !friendId) return;
    try {
      await shareProblem({
        fromUser: user.id,
        toUser: friendId,
        problemId: id,
        shareDate: todayISO(),
      });
      await queryClient.invalidateQueries({ queryKey: ["shares"] });
      await queryClient.invalidateQueries({ queryKey: ["problem-social", id] });
      toast.success(`Shared for today's mission with ${friendName}!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to share.");
    }
  };

  const handleNudgeFriend = async () => {
    if (!user || !friendId) return;
    try {
      await sendSignal(user.id, friendId, "nudge", `🔥 Check out "${problem?.title}"! Waiting for your solution.`);
      toast.success(`Nudge sent to ${friendName}!`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send nudge.");
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Code copied to clipboard!");
  };

  if (probLoading || socialLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-bold">Problem not found</h2>
        <Button asChild className="mt-4">
          <Link to="/problems">Back to Problem Library</Link>
        </Button>
      </div>
    );
  }

  const isSharedToday = shares.some((s) => s.share_date === todayISO());

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
          <Link to="/mission">
            <ArrowLeft className="size-3.5" /> Back to Daily Mission
          </Link>
        </Button>

        {friendId && !isSharedToday && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleQuickShareWithDuo}
            className="gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
          >
            <Send className="size-3.5" />
            Share with {friendName} for Today
          </Button>
        )}
      </div>

      {/* Problem Header Card */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs font-semibold font-mono",
                    DIFFICULTY_CLASS[problem.difficulty ?? "Easy"]
                  )}
                >
                  {problem.difficulty}
                </span>
                <Badge variant="secondary">{problem.platform}</Badge>
                <Badge variant="outline">{problem.topic}</Badge>
                {problem.pattern && <Badge variant="outline">Pattern: {problem.pattern}</Badge>}
              </div>

              <h1 className="text-2xl font-bold tracking-tight">{problem.title}</h1>

              {problem.description && (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {problem.description}
                </p>
              )}
            </div>

            {problem.url && (
              <Button asChild className="gap-2" size="sm">
                <a href={problem.url} target="_blank" rel="noreferrer">
                  Solve on {problem.platform}
                  <ExternalLink className="size-3.5" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs: My Solution vs Peer Comparison */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="editor" className="gap-2">
            <Code2 className="size-4" />
            {mySubmission ? "My Solution & Intuition" : "Log Solution"}
          </TabsTrigger>
          <TabsTrigger value="compare" className="gap-2">
            <Sparkles className="size-4 text-primary" />
            Duo Comparison View
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: SOLUTION EDITOR & INTUITION LOGGER */}
        <TabsContent value="editor" className="space-y-4">
          <form onSubmit={handleSaveSolution} className="space-y-5">
            <Card className="border-border">
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lightbulb className="size-4 text-primary" />
                  Code & Intuition Record
                </CardTitle>
                <CardDescription>
                  Record your thought process, complexity invariants, and working code for your duo partner to review.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Language, Time & Space Complexity */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="sol-lang">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger id="sol-lang">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((l) => (
                          <SelectItem key={l} value={l}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sol-time-c">Time Complexity</Label>
                    <Input
                      id="sol-time-c"
                      placeholder="e.g. O(N), O(N log N)"
                      value={timeComplexity}
                      onChange={(e) => setTimeComplexity(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sol-space-c">Space Complexity</Label>
                    <Input
                      id="sol-space-c"
                      placeholder="e.g. O(1), O(N)"
                      value={spaceComplexity}
                      onChange={(e) => setSpaceComplexity(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>

                {/* Structured Intuition & Key Idea */}
                <div className="space-y-1.5">
                  <Label htmlFor="sol-intuition" className="flex items-center gap-1.5 font-semibold">
                    <Sparkles className="size-3.5 text-primary" />
                    Key Idea & Intuition
                  </Label>
                  <Textarea
                    id="sol-intuition"
                    rows={3}
                    placeholder="What was the 'aha' breakthrough? What invariant or mathematical property makes this approach work?"
                    value={intuition}
                    onChange={(e) => setIntuition(e.target.value)}
                    className="text-sm bg-background/50"
                  />
                </div>

                {/* Approach & Tricky Cases */}
                <div className="space-y-1.5">
                  <Label htmlFor="sol-approach" className="font-semibold">
                    Approach & Tricky / Edge Cases
                  </Label>
                  <Textarea
                    id="sol-approach"
                    rows={3}
                    placeholder="Steps taken, data structures used, edge cases handled (e.g. empty array, duplicates, integer overflow)."
                    value={approach}
                    onChange={(e) => setApproach(e.target.value)}
                    className="text-sm bg-background/50"
                  />
                </div>

                {/* Code Box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sol-code" className="font-semibold">
                      Your Solution Code ({language}) *
                    </Label>
                    {code && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(code)}
                        className="h-6 gap-1 text-[11px] text-muted-foreground"
                      >
                        <Copy className="size-3" /> Copy
                      </Button>
                    )}
                  </div>
                  <Textarea
                    id="sol-code"
                    required
                    rows={14}
                    placeholder="// Paste your final accepted solution code here..."
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="font-mono text-xs leading-relaxed bg-zinc-950 text-emerald-400 border-zinc-800 p-4 selection:bg-emerald-950"
                    spellCheck={false}
                  />
                </div>

                {/* Attempt Outcome & Confidence */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="sol-outcome">How did you solve it?</Label>
                    <Select value={outcome} onValueChange={setOutcome}>
                      <SelectTrigger id="sol-outcome">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OUTCOMES.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sol-time-taken">Time Spent (min)</Label>
                    <Input
                      id="sol-time-taken"
                      type="number"
                      min={1}
                      max={300}
                      value={timeTakenMin}
                      onChange={(e) => setTimeTakenMin(Number(e.target.value))}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="sol-conf">Confidence (1-5)</Label>
                    <Select value={String(confidence)} onValueChange={(v) => setConfidence(Number(v))}>
                      <SelectTrigger id="sol-conf">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 - Crystal Clear (Could explain in interview)</SelectItem>
                        <SelectItem value="4">4 - High Confidence</SelectItem>
                        <SelectItem value="3">3 - Moderate (Need more practice)</SelectItem>
                        <SelectItem value="2">2 - Shaky</SelectItem>
                        <SelectItem value="1">1 - Clueless without help</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={saving} size="lg" className="gap-2">
                    <CheckCircle2 className="size-4" />
                    {saving ? "Saving Solution..." : "Save Solution & Log Attempt"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>

        {/* TAB 2: DUO CODE & INTUITION COMPARISON */}
        <TabsContent value="compare" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* MY SOLUTION COLUMN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-primary" />
                  <h3 className="font-semibold text-sm">My Solution & Intuition</h3>
                </div>
                {mySubmission && (
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {mySubmission.language}
                  </Badge>
                )}
              </div>

              {!mySubmission ? (
                <Card className="border-dashed p-8 text-center text-xs text-muted-foreground">
                  You haven't logged a solution for this problem yet.
                  <div className="mt-3">
                    <Button size="sm" onClick={() => setActiveTab("editor")}>
                      Log My Solution
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="border-border space-y-4 p-4">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Badge variant="secondary">Time: {mySubmission.time_complexity || "N/A"}</Badge>
                    <Badge variant="secondary">Space: {mySubmission.space_complexity || "N/A"}</Badge>
                  </div>

                  {mySubmission.intuition && (
                    <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-1">
                      <div className="text-xs font-semibold text-primary flex items-center gap-1.5">
                        <Sparkles className="size-3.5" /> Key Intuition
                      </div>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap">
                        {mySubmission.intuition}
                      </p>
                    </div>
                  )}

                  {mySubmission.approach && (
                    <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1">
                      <div className="text-xs font-semibold text-foreground">Approach & Tricky Cases</div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {mySubmission.approach}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Code</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(mySubmission.code)}
                        className="h-6 px-2 text-[10px]"
                      >
                        <Copy className="size-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="rounded-md bg-zinc-950 p-3 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[420px] leading-relaxed border border-zinc-800">
                      <code>{mySubmission.code}</code>
                    </pre>
                  </div>
                </Card>
              )}
            </div>

            {/* FRIEND'S SOLUTION COLUMN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="size-2 rounded-full bg-blue-500" />
                  <h3 className="font-semibold text-sm">{friendName}'s Solution & Intuition</h3>
                </div>
                {friendSubmission && (
                  <Badge variant="outline" className="font-mono text-[11px]">
                    {friendSubmission.language}
                  </Badge>
                )}
              </div>

              {!friendSubmission ? (
                <Card className="border-dashed p-8 text-center text-xs text-muted-foreground space-y-3">
                  <div className="mx-auto size-10 grid place-items-center rounded-full bg-muted">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    {friendName} hasn't submitted a solution for this problem yet.
                  </div>
                  {friendId && (
                    <Button variant="outline" size="sm" onClick={handleNudgeFriend} className="gap-1.5">
                      <Zap className="size-3.5 text-amber-500 fill-amber-500" />
                      Nudge {friendName} to solve
                    </Button>
                  )}
                </Card>
              ) : (
                <Card className="border-border space-y-4 p-4">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <Badge variant="secondary">Time: {friendSubmission.time_complexity || "N/A"}</Badge>
                    <Badge variant="secondary">Space: {friendSubmission.space_complexity || "N/A"}</Badge>
                  </div>

                  {friendSubmission.intuition && (
                    <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 space-y-1">
                      <div className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
                        <Sparkles className="size-3.5" /> Key Intuition
                      </div>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap">
                        {friendSubmission.intuition}
                      </p>
                    </div>
                  )}

                  {friendSubmission.approach && (
                    <div className="rounded-lg bg-muted/40 border border-border p-3 space-y-1">
                      <div className="text-xs font-semibold text-foreground">Approach & Tricky Cases</div>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                        {friendSubmission.approach}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Code</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyCode(friendSubmission.code)}
                        className="h-6 px-2 text-[10px]"
                      >
                        <Copy className="size-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <pre className="rounded-md bg-zinc-950 p-3 font-mono text-xs text-sky-400 overflow-x-auto max-h-[420px] leading-relaxed border border-zinc-800">
                      <code>{friendSubmission.code}</code>
                    </pre>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* SECTION 3: PER-PROBLEM DISCUSSION FEED */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="size-4 text-primary" />
            Duo Discussion & Peer Feedback
          </CardTitle>
          <CardDescription>
            Debate edge cases, suggest algorithmic optimizations, or ask questions on each other's solution.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Discussion feed list */}
          {discussions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No notes in this discussion yet. Start the conversation with your partner below!
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {discussions.map((msg) => {
                const isMe = msg.user_id === user?.id;
                const authorName = names?.[msg.user_id] || (isMe ? "You" : friendName);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "rounded-lg p-3 text-xs space-y-1 border",
                      isMe
                        ? "bg-primary/5 border-primary/20 ml-8"
                        : "bg-muted/40 border-border mr-8"
                    )}
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-semibold text-foreground">{authorName}</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-foreground/90">{msg.body}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment Input */}
          <form onSubmit={handlePostComment} className="flex gap-2 pt-2">
            <Input
              placeholder={`Leave a note or question for ${friendName}...`}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="text-xs"
            />
            <Button type="submit" disabled={postingComment || !commentText.trim()} size="sm" className="gap-1.5">
              <Send className="size-3.5" />
              {postingComment ? "Posting..." : "Post"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
