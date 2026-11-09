import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Flame, Target, Repeat, BarChart3, Users, Brain } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DSA Forge — Train the pattern. Master the problem." },
      {
        name: "description",
        content:
          "A focused DSA training system: daily missions, reflection-based tracking, spaced review, weak-area detection and duo accountability.",
      },
      { property: "og:title", content: "DSA Forge — Train the pattern. Master the problem." },
      {
        property: "og:description",
        content: "Daily missions, spaced review, weak-area analytics and duo accountability.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Target, title: "Daily 3-problem mission", body: "Generated from your weak areas, failed problems and review schedule." },
  { icon: Brain, title: "Reflection over counting", body: "Every attempt records key idea, mistakes, complexity and confidence." },
  { icon: Repeat, title: "Spaced re-solving", body: "Day 1 / 3 / 7 / 14 / 30 reviews that adapt to how confident you felt." },
  { icon: BarChart3, title: "Weak area engine", body: "Actionable diagnosis, not a percentage: why it's weak and what to do." },
  { icon: Flame, title: "Streaks with integrity", body: "A day counts on real work, and daily target is tracked separately." },
  { icon: Users, title: "Duo accountability", body: "Two friends, shared goals, supportive nudges — no toxic leaderboard." },
];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-md bg-primary text-primary-foreground">
            <Flame className="size-4" />
          </div>
          <span className="font-semibold tracking-tight">DSA Forge</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="forge-glow border-b border-border">
        <div className="forge-grid">
          <div className="mx-auto max-w-3xl px-6 py-24 text-center">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              Developer training command center
            </p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-5xl">
              Train the pattern.
              <br />
              Master the problem.
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-muted-foreground">
              DSA Forge is a serious interview-prep system for two people training together.
              Learn, solve, analyze, record, review, re-solve, master.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth">Start training</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="panel p-5">
            <f.icon className="size-5 text-primary" />
            <h3 className="mt-3 text-sm font-medium">{f.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border px-6 py-8 text-center text-xs text-muted-foreground">
        DSA Forge — 100 blindly solved problems don't beat 60 deeply understood ones.
      </footer>
    </div>
  );
}
