import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Award,
  BarChart3,
  Flame,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Moon,
  Route as RouteIcon,
  Settings,
  Sun,
  Swords,
  Target,
  Timer,
  User,
  Users,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useProfile, useTodayMission, useTraining } from "@/hooks/useForge";
import { computeStreaks, readiness } from "@/lib/metrics";
import { Button } from "@/components/ui/button";

import { todayISO } from "@/lib/constants";
import { isSolved } from "@/lib/metrics";

import { History } from "lucide-react";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/mission", label: "Daily Mission", icon: Target },
  { to: "/problems", label: "Past Missions", icon: History },
  { to: "/duo", label: "Duo Partner", icon: Users },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
] as const;

const MOBILE_NAV = NAV;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useProfile();
  const { data: training } = useTraining();
  const { data: mission } = useTodayMission();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("forge-theme");
    const isDark = stored !== "light";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("forge-theme", next ? "dark" : "light");
  };

  const attempts = training?.attempts ?? [];
  const streak = computeStreaks(attempts).current;
  const target = profile?.daily_target ?? 3;
  const doneToday = attempts.filter((a) => a.solved_on === todayISO() && isSolved(a)).length;
  const score = training
    ? readiness(attempts, training.reviews, training.mistakes, target).total
    : 0;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <Link to="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Flame className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight">DSA Forge</div>
            <div className="text-[10px] text-muted-foreground">Train the pattern.</div>
          </div>
        </Link>

        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-0.5 border-t border-sidebar-border px-3 py-3">
          <Link
            to="/profile"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <User className="size-4" /> Profile
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <Settings className="size-4" /> Settings
          </Link>
          <button
            onClick={signOut}
            className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Flame className="size-3.5" />
            </div>
            <span className="text-sm font-semibold">DSA Forge</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
            <span className="flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs" title="Current streak">
              <Flame className="size-3.5 text-primary" />
              <span>{streak}d</span>
            </span>
            <span className="rounded-md border border-border bg-card px-2.5 py-1 font-mono text-xs">
              <span className="text-foreground font-semibold">{doneToday}</span>
              <span className="text-muted-foreground ml-1">solved today</span>
            </span>
            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
              {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:pb-12">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-background/95 backdrop-blur lg:hidden">
        {MOBILE_NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}
