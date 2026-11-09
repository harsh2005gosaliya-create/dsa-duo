import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Flame, Sparkles, User, Code2, Target, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useForge";
import { DSA_LEVELS, LANGUAGES, TARGET_ROLES } from "@/lib/constants";
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

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("C++");
  const [dsaLevel, setDsaLevel] = useState("Beginner");
  const [targetRole, setTargetRole] = useState("Software Engineer");
  const [dailyTarget, setDailyTarget] = useState(3);
  const [busy, setBusy] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  useEffect(() => {
    if (profile) {
      if (profile.onboarded) {
        navigate({ to: "/dashboard", replace: true });
        return;
      }
      setName(profile.name || "");
      if (profile.username) setUsername(profile.username);
      if (profile.preferred_language) setPreferredLanguage(profile.preferred_language);
      if (profile.dsa_level) setDsaLevel(profile.dsa_level);
      if (profile.target_role) setTargetRole(profile.target_role);
      if (profile.daily_target) setDailyTarget(profile.daily_target);
    }
  }, [profile, navigate]);

  const checkUsername = async (val: string) => {
    const clean = val.trim().toLowerCase();
    if (!clean || clean.length < 3) {
      setUsernameStatus("idle");
      return;
    }
    setUsernameStatus("checking");
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", clean)
        .neq("id", user?.id ?? "")
        .maybeSingle();
      if (error) throw error;
      setUsernameStatus(data ? "taken" : "available");
    } catch {
      setUsernameStatus("idle");
    }
  };

  const handleUsernameChange = (val: string) => {
    const formatted = val.toLowerCase().replace(/[^a-z0-9_]/g, "");
    setUsername(formatted);
    checkUsername(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3) {
      toast.error("Username must be at least 3 characters.");
      return;
    }

    setBusy(true);
    try {
      // Ensure unique username
      const { data: existing, error: checkErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("username", cleanUsername)
        .neq("id", user.id)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (existing) {
        toast.error("This username is already taken. Please pick another one.");
        setUsernameStatus("taken");
        setBusy(false);
        return;
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
          onboarded: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile setup complete! Let's pair with your duo partner.");
      navigate({ to: "/duo" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save profile.");
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-spin text-primary">
          <Flame className="size-8" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 grid size-12 place-items-center rounded-xl bg-primary/10 text-primary">
          <Flame className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to DSA Forge</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Set up your profile and primary programming language to train with your partner.
        </p>
      </div>

      <Card className="border-border bg-card/60 shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Your Duo Identity
          </CardTitle>
          <CardDescription>
            Your partner will search and find you using your unique username.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Username Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="onb-username">Unique Username *</Label>
                {usernameStatus === "available" && (
                  <span className="flex items-center gap-1 text-xs text-emerald-500 font-medium">
                    <Check className="size-3" /> Available
                  </span>
                )}
                {usernameStatus === "taken" && (
                  <span className="text-xs text-destructive font-medium">Already taken</span>
                )}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">@</span>
                <Input
                  id="onb-username"
                  required
                  placeholder="e.g. harsh_coder"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className="pl-8 font-mono text-sm"
                  autoCapitalize="none"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Letters, numbers, and underscores only. Minimum 3 characters.
              </p>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <Label htmlFor="onb-name">Display Name</Label>
              <Input
                id="onb-name"
                placeholder="e.g. Harsh"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Preferred Programming Language */}
            <div className="space-y-1.5">
              <Label htmlFor="onb-lang" className="flex items-center gap-1.5">
                <Code2 className="size-3.5 text-primary" />
                Preferred Programming Language *
              </Label>
              <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
                <SelectTrigger id="onb-lang">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">
                Default syntax and template when opening the solution editor.
              </p>
            </div>

            {/* DSA Level & Target Role */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="onb-level">DSA Experience</Label>
                <Select value={dsaLevel} onValueChange={setDsaLevel}>
                  <SelectTrigger id="onb-level">
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
                <Label htmlFor="onb-role">Target Role</Label>
                <Select value={targetRole} onValueChange={setTargetRole}>
                  <SelectTrigger id="onb-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TARGET_ROLES.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Daily Target */}
            <div className="space-y-1.5">
              <Label htmlFor="onb-target" className="flex items-center gap-1.5">
                <Target className="size-3.5 text-primary" />
                Daily Questions Target
              </Label>
              <Select
                value={String(dailyTarget)}
                onValueChange={(v) => setDailyTarget(Number(v))}
              >
                <SelectTrigger id="onb-target">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 question / day (Casual pace)</SelectItem>
                  <SelectItem value="2">2 questions / day (Consistent)</SelectItem>
                  <SelectItem value="3">3 questions / day (Standard Grind)</SelectItem>
                  <SelectItem value="4">4 questions / day (Intensive)</SelectItem>
                  <SelectItem value="5">5 questions / day (Sprint mode)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={busy || usernameStatus === "taken" || username.length < 3}
              className="w-full gap-2 mt-4"
              size="lg"
            >
              {busy ? (
                "Setting up..."
              ) : (
                <>
                  Complete Setup & Pair with Duo <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
