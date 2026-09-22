import { useState } from "react";
import { Plus, Sparkles, Send } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDuo } from "@/hooks/useForge";
import { shareProblem } from "@/lib/social";
import {
  DIFFICULTIES,
  PLATFORMS,
  TOPICS,
  platformFromUrl,
  titleFromUrl,
  todayISO,
} from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface ProblemAddDialogProps {
  trigger?: React.ReactNode;
  defaultShareWithDuo?: boolean;
  onProblemAdded?: (problemId: string) => void;
}

export function ProblemAddDialog({
  trigger,
  defaultShareWithDuo = true,
  onProblemAdded,
}: ProblemAddDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>("LeetCode");
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium");
  const [topic, setTopic] = useState<string>("Arrays");
  const [pattern, setPattern] = useState("");
  const [description, setDescription] = useState("");
  const [shareWithDuo, setShareWithDuo] = useState(defaultShareWithDuo);
  const [duoMessage, setDuoMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const { user } = useAuth();
  const { data: duoData } = useDuo();
  const queryClient = useQueryClient();

  const friendId = duoData?.friendId;
  const friendName = duoData?.friendProfile?.name || duoData?.friendProfile?.username || "Friend";

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl.trim()) return;

    const detectedPlatform = platformFromUrl(newUrl);
    setPlatform(detectedPlatform);

    const extractedTitle = titleFromUrl(newUrl);
    if (extractedTitle && (!title || title.trim() === "")) {
      setTitle(extractedTitle);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      toast.error("Please provide a problem title.");
      return;
    }

    setBusy(true);
    try {
      // 1. Insert problem
      const { data: newProblem, error: problemErr } = await supabase
        .from("problems")
        .insert({
          title: title.trim(),
          platform,
          url: url.trim() || null,
          difficulty,
          topic,
          pattern: pattern.trim() || null,
          description: description.trim() || null,
          created_by: user.id,
        })
        .select("id, title")
        .single();

      if (problemErr) throw problemErr;

      // 2. Share with Duo partner if requested and friend exists
      if (shareWithDuo && friendId) {
        await shareProblem({
          fromUser: user.id,
          toUser: friendId,
          problemId: newProblem.id,
          message: duoMessage.trim() || undefined,
          shareDate: todayISO(),
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["problems"] });
      await queryClient.invalidateQueries({ queryKey: ["shares"] });
      await queryClient.invalidateQueries({ queryKey: ["mission"] });
      await queryClient.invalidateQueries({ queryKey: ["training"] });

      toast.success(
        shareWithDuo && friendId
          ? `Added "${newProblem.title}" and shared with ${friendName} for today!`
          : `Added "${newProblem.title}" to problem list!`
      );

      // Reset form
      setUrl("");
      setTitle("");
      setPlatform("LeetCode");
      setDifficulty("Medium");
      setTopic("Arrays");
      setPattern("");
      setDescription("");
      setDuoMessage("");
      setOpen(false);

      if (onProblemAdded) {
        onProblemAdded(newProblem.id);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add problem.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2">
            <Plus className="size-4" />
            Add Problem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              Add & Share Problem
            </DialogTitle>
            <DialogDescription>
              Paste any external link (LeetCode, GFG, Codeforces, etc.) to auto-detect and share with your duo partner.
            </DialogDescription>
          </DialogHeader>

          {/* URL Input */}
          <div className="space-y-1.5">
            <Label htmlFor="prob-url">Problem URL</Label>
            <Input
              id="prob-url"
              placeholder="e.g. https://leetcode.com/problems/two-sum/"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
            />
            <p className="text-[11px] text-muted-foreground">
              Auto-detects platform & extracts problem title.
            </p>
          </div>

          {/* Title & Platform */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prob-title">Title *</Label>
              <Input
                id="prob-title"
                required
                placeholder="Two Sum"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prob-platform">Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger id="prob-platform">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Difficulty & Topic */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="prob-diff">Difficulty</Label>
              <Select
                value={difficulty}
                onValueChange={(v) => setDifficulty(v as "Easy" | "Medium" | "Hard")}
              >
                <SelectTrigger id="prob-diff">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prob-topic">Topic</Label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger id="prob-topic">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {TOPICS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pattern / Subtopic */}
          <div className="space-y-1.5">
            <Label htmlFor="prob-pattern">Pattern / Technique (optional)</Label>
            <Input
              id="prob-pattern"
              placeholder="e.g. Hash Map, Two Pointers, Prefix Sum"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
            />
          </div>

          {/* Share with Duo Partner option */}
          {friendId ? (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3.5 space-y-2.5">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="share-duo"
                  checked={shareWithDuo}
                  onCheckedChange={(checked) => setShareWithDuo(!!checked)}
                />
                <Label
                  htmlFor="share-duo"
                  className="text-xs font-semibold cursor-pointer text-foreground flex items-center gap-1.5"
                >
                  <Send className="size-3.5 text-primary" />
                  Assign to Today's Mission for {friendName}
                </Label>
              </div>

              {shareWithDuo && (
                <div className="pt-1">
                  <Input
                    placeholder={`Note for ${friendName} (e.g. "Focus on O(1) space approach!")`}
                    value={duoMessage}
                    onChange={(e) => setDuoMessage(e.target.value)}
                    className="h-8 text-xs bg-background/70"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs text-muted-foreground">
              Tip: Pair with your friend in the{" "}
              <a href="/duo" className="text-primary underline">
                Duo page
              </a>{" "}
              to assign daily mission questions directly to each other.
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="gap-1.5">
              {busy ? "Saving..." : shareWithDuo && friendId ? "Add & Share for Today" : "Add Problem"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
