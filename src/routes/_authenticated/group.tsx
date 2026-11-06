// src/routes/_authenticated/group.tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useGroup } from "@/hooks/useGroup";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { NudgeButton } from "@/components/NudgeButton";
import { Leaderboard } from "@/components/Leaderboard";
import { HeatMap } from "@/components/HeatMap";
import { PageHeader } from "@/components/AppShell";
import { ProblemAddDialog } from "@/components/ProblemAddDialog";

export const Route = createFileRoute("/_authenticated/group")({
  component: GroupPage,
});

function GroupPage() {
  const { user } = useAuth();
  const { group, loading, createGroup, joinGroup } = useGroup();
  const [newName, setNewName] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  if (loading) return <div className="p-4">Loading…</div>;

  if (!group) {
    return (
      <div className="max-w-xl mx-auto p-4 space-y-6">
        <PageHeader title="Create or Join a Group" description="Groups let you and any number of friends share DSA problems, see each other's progress and nudge each other." />
        <Card>
          <CardHeader><CardTitle>Create a New Group</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Group name (e.g. ‘DSA Squad’)" value={newName} onChange={e => setNewName(e.target.value)} />
            <Button disabled={!newName} onClick={async () => {
              try { await createGroup(newName); toast.success("Group created!"); } catch (e) { toast.error("Failed to create group"); }
            }}>Create Group</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Join an Existing Group</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Invite code (group UUID)" value={inviteCode} onChange={e => setInviteCode(e.target.value)} />
            <Button disabled={!inviteCode} onClick={async () => {
              try { await joinGroup(inviteCode); toast.success("Joined group!"); } catch (e) { toast.error("Failed to join group"); }
            }}>Join Group</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Group view – list members, nudge, leaderboard, heat‑map
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <PageHeader title={group.name} description={`You are in a group with ${group.members.length} members.`} />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Members</h2>
        <ul className="list-disc list-inside">
          {group.members.map(m => (
            <li key={m.user_id}>{m.username} {m.role === 'admin' && '(admin)'}</li>
          ))}
        </ul>
        {user && <NudgeButton group={group} senderId={user.id} />}
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Group Dashboard</h2>
        <ProblemAddDialog defaultShareWithGroup={true} trigger={<Button>+ Add Problem for Group</Button>} />
        <Leaderboard group={group} />
        <HeatMap groupId={group.id} />
      </section>
    </div>
  );
}
