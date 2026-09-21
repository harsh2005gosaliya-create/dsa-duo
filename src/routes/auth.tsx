import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — DSA Forge" },
      { name: "description", content: "Sign in to your DSA Forge training account." },
      { property: "og:title", content: "Sign in — DSA Forge" },
      { property: "og:description", content: "Train the pattern. Master the problem." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) navigate({ to: "/dashboard", replace: true });
  }, [session, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back.");
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name }, emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Check your email to confirm your account, then sign in.");
          setMode("signin");
        } else {
          navigate({ to: "/onboarding" });
        }
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Password reset link sent.");
        setMode("signin");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="forge-glow flex min-h-screen items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
              <Flame className="size-4.5" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">DSA Forge</div>
              <div className="text-xs text-muted-foreground">
                Train the pattern. Master the problem.
              </div>
            </div>
          </div>

          <div className="panel p-6">
            <h1 className="text-lg font-semibold">
              {mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create your account"
                  : "Reset password"}
            </h1>
            <form onSubmit={submit} className="mt-5 space-y-4">
              {mode === "signup" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? "Working…"
                  : mode === "signin"
                    ? "Sign in"
                    : mode === "signup"
                      ? "Create account"
                      : "Send reset link"}
              </Button>
            </form>

            <div className="mt-5 space-y-2 text-sm text-muted-foreground">
              {mode !== "signin" ? (
                <button className="hover:text-foreground" onClick={() => setMode("signin")}>
                  Already have an account? Sign in
                </button>
              ) : (
                <>
                  <button
                    className="block hover:text-foreground"
                    onClick={() => setMode("signup")}
                  >
                    New here? Create an account
                  </button>
                  <button
                    className="block hover:text-foreground"
                    onClick={() => setMode("forgot")}
                  >
                    Forgot your password?
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
