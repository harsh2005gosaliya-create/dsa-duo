import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — DSA Forge" },
      { name: "description", content: "Choose a new password for your DSA Forge account." },
      { property: "og:title", content: "Reset password — DSA Forge" },
      { property: "og:description", content: "Choose a new password for DSA Forge." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated.");
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen items-center justify-center px-4">
        <form onSubmit={submit} className="panel w-full max-w-sm space-y-4 p-6">
          <h1 className="text-lg font-semibold">Set a new password</h1>
          <div className="space-y-1.5">
            <Label htmlFor="pw">New password</Label>
            <Input
              id="pw"
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
