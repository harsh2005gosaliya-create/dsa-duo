import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  LogOut,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useForge";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("forge-theme");
    setDark(stored !== "light");
  }, []);

  const handleToggleTheme = (isDark: boolean) => {
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("forge-theme", isDark ? "dark" : "light");
    toast.success(isDark ? "Dark theme enabled." : "Light theme enabled.");
  };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out successfully.");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Settings"
        description="Application preferences, appearance, and account management."
      />

      <div className="space-y-4">
        {/* Appearance Settings */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Palette className="size-4 text-primary" />
              Appearance
            </CardTitle>
            <CardDescription>Customize the interface theme.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  High-contrast dark developer theme for long coding sessions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {dark ? <Moon className="size-4 text-primary" /> : <Sun className="size-4 text-amber-500" />}
                <Switch checked={dark} onCheckedChange={handleToggleTheme} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="size-4 text-primary" />
              Account & Security
            </CardTitle>
            <CardDescription>Authentication details associated with your account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <div className="rounded-lg border border-border p-3 space-y-2 bg-muted/20 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Email:</span>
                <span>{user?.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">User ID:</span>
                <span className="truncate max-w-[200px] sm:max-w-xs">{user?.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground font-sans">Username:</span>
                <span>@{profile?.username || "unset"}</span>
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleSignOut}
                className="gap-2"
              >
                <LogOut className="size-3.5" />
                Sign Out of DSA Forge
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
