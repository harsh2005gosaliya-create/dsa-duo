import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Code2,
  Flame,
  Save,
  Target,
  User,
  Users,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDuo, useProfile, useTraining } from "@/hooks/useForge";
import { DSA_LEVELS, LANGUAGES, TARGET_ROLES } from "@/lib/constants";
import { computeStreaks, isSolved } from "@/lib/metrics";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { data: duoData } = useDuo();
  const { data: training } = useTraining();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("C++");
  const [dsaLevel, setDsaLevel] = useState("Beginner");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [dailyTarget, setDailyTarget] = useState(3);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || "");
      setUsername(profile.username || "");
      setPreferredLanguage(profile.preferred_language || "C++");
      setDsaLevel(profile.dsa_level || "Beginner");
      setTargetRole(profile.target_role || "Software Engineer");
      setDailyTarget(profile.daily_target || 3);
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (cleanUsername.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }

    setSaving(true);
    try {
      // Check username uniqueness if changed
      if (cleanUsername !== profile?.username?.toLowerCase()) {
        const { data: existing, error: checkErr } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", cleanUsername)
          .neq("id", user.id)
          .maybeSingle();

        if (checkErr) throw checkErr;
        if (existing) {
          toast.error("That username is already taken.");
          setSaving(false);
          return;
        }
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          name: name.trim() || cleanUsername,
          username: cleanUsername,
          preferred_language: preferredLanguage,
          dsa_level: dsaLevel,
          target_role: targetRole,
          daily_target: Number(dailyTarget) || 3,
        })
        .eq("id", user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile updated successfully!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full max-w-xl" />
      </div>
    );
  }

  const attempts = training?.attempts ?? [];
  const streaks = computeStreaks(attempts);
  const solvedCount = attempts.filter(isSolved).length;
  const friend = duoData?.friendProfile;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Your Profile"
        description="Manage your username, coding language, and training settings."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card Summary */}
        <Card className="border-border">
          <CardHeader>
            <div className="mx-auto size-16 grid place-items-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl shadow-md">
              {(profile?.name || profile?.username || "U")[0].toUpperCase()}
            </div>
            <div className="text-center mt-2">
              <CardTitle className="text-lg">{profile?.name || "Learner"}</CardTitle>
              <p className="text-xs font-mono text-muted-foreground mt-0.5">
                @{profile?.username || "no_username"}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            <div className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Primary Language:</span>
                <span className="font-semibold text-foreground">{profile?.preferred_language}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Current Streak:</span>
                <span className="font-semibold font-mono text-primary flex items-center gap-1">
                  <Flame className="size-3 text-primary" /> {streaks.current} days
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Problems Solved:</span>
                <span className="font-semibold font-mono">{solvedCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duo Partner:</span>
                {friend ? (
                  <Link to="/duo" className="font-semibold text-primary underline">
                    @{friend.username}
                  </Link>
                ) : (
                  <Link to="/duo" className="text-muted-foreground underline">
                    Not paired
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Edit Form */}
        <Card className="border-border md:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="size-4 text-primary" />
              Edit Profile Details
            </CardTitle>
            <CardDescription>
              Changes to your language or daily target apply across missions immediately.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-name">Display Name</Label>
                  <Input
                    id="prof-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-username">Username (@)</Label>
                  <Input
                    id="prof-username"
                    required
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
                    }
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-lang">Preferred Language</Label>
                  <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                    <SelectTrigger id="prof-lang">
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
                  <Label htmlFor="prof-target">Daily Target Questions</Label>
                  <Select
                    value={String(dailyTarget)}
                    onValueChange={(v) => setDailyTarget(Number(v))}
                  >
                    <SelectTrigger id="prof-target">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 problem / day</SelectItem>
                      <SelectItem value="2">2 problems / day</SelectItem>
                      <SelectItem value="3">3 problems / day</SelectItem>
                      <SelectItem value="4">4 problems / day</SelectItem>
                      <SelectItem value="5">5 problems / day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="prof-level">DSA Level</Label>
                  <Select value={dsaLevel} onValueChange={setDsaLevel}>
                    <SelectTrigger id="prof-level">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DSA_LEVELS.map((lvl) => (
                        <SelectItem key={lvl} value={lvl}>
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-role">Target Role</Label>
                  <Select value={targetRole} onValueChange={setTargetRole}>
                    <SelectTrigger id="prof-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_ROLES.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={saving} className="gap-2">
                  <Save className="size-4" />
                  {saving ? "Saving Changes..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
