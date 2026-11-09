import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  Check,
  X,
  Flame,
  Zap,
  Code2,
  Calendar,
  Send,
  UserCheck,
  AlertCircle,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDuo, useProfile, useTraining } from "@/hooks/useForge";
import { requestFriend, respondToFriendRequest, sendSignal } from "@/lib/social";
import { computeStreaks, isSolved } from "@/lib/metrics";
import { todayISO } from "@/lib/constants";
import { PageHeader } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProblemAddDialog } from "@/components/ProblemAddDialog";

export const Route = createFileRoute("/_authenticated/duo")({
  component: DuoPage,
});

function DuoPage() {
  const { user } = useAuth();
  const { data: myProfile } = useProfile();
  const { data: duoData, isLoading: duoLoading } = useDuo();
  const { data: training } = useTraining();
  const queryClient = useQueryClient();

  const [searchUsername, setSearchUsername] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundUser, setFoundUser] = useState<{ id: string; name: string; username: string } | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);

  // Incoming and outgoing pending requests
  const friendships = duoData?.friendships ?? [];
  const acceptedFriendship = friendships.find((f) => f.status === "accepted");
  const incoming = friendships.filter((f) => f.status === "pending" && f.addressee_id === user?.id);
  const outgoing = friendships.filter((f) => f.status === "pending" && f.requester_id === user?.id);

  // Query profiles for pending requests
  const pendingUserIds = [...incoming.map((i) => i.requester_id), ...outgoing.map((o) => o.addressee_id)];
  const { data: pendingProfiles } = useQuery({
    queryKey: ["pending-profiles", pendingUserIds],
    enabled: pendingUserIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, username, preferred_language")
        .in("id", pendingUserIds);
      if (error) throw error;
      const map: Record<string, { name: string; username: string; preferred_language: string }> = {};
      data?.forEach((p) => {
        map[p.id] = p;
      });
      return map;
    },
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = searchUsername.trim().toLowerCase().replace(/^@/, "");
    if (!clean) return;

    if (clean === myProfile?.username?.toLowerCase()) {
      toast.error("You cannot add yourself as a duo partner.");
      return;
    }

    setSearching(true);
    setFoundUser(null);
    try {
      const { data, error } = await supabase.rpc("find_user_by_username", { uname: clean });
      if (error) throw error;
      const match = (data ?? [])[0];
      if (!match) {
        toast.error(`No user found with username "@${clean}".`);
      } else {
        setFoundUser(match);
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (targetId: string, username: string) => {
    if (!user) return;
    setRequestBusy(true);
    try {
      await requestFriend(user.id, username);
      toast.success(`Duo request sent to @${username}!`);
      setFoundUser(null);
      setSearchUsername("");
      await queryClient.invalidateQueries({ queryKey: ["duo"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send friend request.");
    } finally {
      setRequestBusy(false);
    }
  };

  const handleRespond = async (friendshipId: string, accept: boolean) => {
    try {
      await respondToFriendRequest(friendshipId, accept);
      toast.success(accept ? "Duo partner accepted! You are now paired." : "Request declined.");
      await queryClient.invalidateQueries({ queryKey: ["duo"] });
      await queryClient.invalidateQueries({ queryKey: ["training"] });
      await queryClient.invalidateQueries({ queryKey: ["shares"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const handleUnpair = async (friendshipId: string) => {
    if (!confirm("Are you sure you want to unpair from your duo partner?")) return;
    try {
      await respondToFriendRequest(friendshipId, false);
      toast.info("Unpaired from partner.");
      await queryClient.invalidateQueries({ queryKey: ["duo"] });
      await queryClient.invalidateQueries({ queryKey: ["shares"] });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Action failed.");
    }
  };

  const handleSendNudge = async () => {
    if (!user || !duoData?.friendId) return;
    try {
      await sendSignal(user.id, duoData.friendId, "nudge", "🔥 Time to solve today's DSA mission together!");
      toast.success("Nudge sent to your partner!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send nudge.");
    }
  };

  if (duoLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const isPaired = !!acceptedFriendship && !!duoData?.friendProfile;
  const friend = duoData?.friendProfile;
  const friendAttempts = duoData?.friendAttempts ?? [];
  const myAttempts = training?.attempts ?? [];

  const myStreaks = computeStreaks(myAttempts);
  const friendStreaks = computeStreaks(friendAttempts);

  const mySolved = myAttempts.filter(isSolved).length;
  const friendSolved = friendAttempts.filter(isSolved).length;

  const today = todayISO();
  const myTodaySolved = myAttempts.filter((a) => a.solved_on === today && isSolved(a)).length;
  const friendTodaySolved = friendAttempts.filter((a) => a.solved_on === today && isSolved(a)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duo Partnership"
        description="DSA training is 10x more effective with mutual accountability. Pair up, share daily questions, and review solutions together."
        action={
          isPaired ? (
            <ProblemAddDialog
              defaultShareWithDuo={true}
              trigger={
                <Button className="gap-2">
                  <Plus className="size-4" />
                  Share Problem with {friend?.name || friend?.username}
                </Button>
              }
            />
          ) : undefined
        }
      />

      {/* ACTIVE DUO VIEW */}
      {isPaired && friend && (
        <div className="space-y-6">
          <Card className="border-primary/40 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="pb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-md">
                    {(friend.name || friend.username || "P")[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{friend.name || friend.username}</CardTitle>
                      <Badge variant="secondary" className="font-mono text-xs text-primary border-primary/30">
                        @{friend.username}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Code2 className="size-3.5" />
                      {friend.preferred_language || "C++"} · Target: {friend.daily_target || 3} problems/day
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSendNudge} className="gap-1.5">
                    <Zap className="size-3.5 text-amber-500 fill-amber-500" />
                    Nudge
                  </Button>
                  <Button asChild size="sm" className="gap-1.5">
                    <Link to="/mission">
                      <Calendar className="size-3.5" />
                      Today's Mission
                    </Link>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
                <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">Mutual Streak</div>
                  <div className="mt-1 flex items-center gap-1.5 text-2xl font-bold font-mono">
                    <Flame className="size-5 text-primary" />
                    {Math.min(myStreaks.current, friendStreaks.current)}
                    <span className="text-xs font-normal text-muted-foreground">days</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    You: {myStreaks.current}d · Partner: {friendStreaks.current}d
                  </div>
                </div>

                <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">Solved Today</div>
                  <div className="mt-1 flex items-center gap-2 text-2xl font-bold font-mono">
                    <span>{myTodaySolved}</span>
                    <span className="text-muted-foreground text-sm font-normal">vs</span>
                    <span className="text-primary">{friendTodaySolved}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">You vs Partner</div>
                </div>

                <div className="rounded-lg border border-border/70 bg-background/50 p-3">
                  <div className="text-xs text-muted-foreground">Total Solved</div>
                  <div className="mt-1 flex items-center gap-2 text-2xl font-bold font-mono">
                    <span>{mySolved}</span>
                    <span className="text-muted-foreground text-sm font-normal">vs</span>
                    <span className="text-primary">{friendSolved}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">Verified submissions</div>
                </div>

                <div className="rounded-lg border border-border/70 bg-background/50 p-3 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Partner Status</div>
                    <div className="mt-1 font-semibold text-sm flex items-center gap-1.5 text-emerald-500">
                      <UserCheck className="size-4" /> Active Duo
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnpair(acceptedFriendship.id)}
                    className="text-[11px] text-muted-foreground hover:text-destructive text-left transition-colors"
                  >
                    Unpair partner
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* NOT PAIRED OR LOOKING TO PAIR */}
      {!isPaired && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* SEARCH & INVITE CARD */}
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="size-4 text-primary" />
                Find Your Duo Partner
              </CardTitle>
              <CardDescription>
                Search by your friend's exact unique username to send a duo request.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2.5 text-xs text-muted-foreground font-mono">@</span>
                    <Input
                      placeholder="e.g. friend_username"
                      value={searchUsername}
                      onChange={(e) => setSearchUsername(e.target.value)}
                      className="pl-8 font-mono text-sm"
                    />
                  </div>
                  <Button type="submit" disabled={searching || !searchUsername.trim()} className="gap-1.5">
                    {searching ? "Searching..." : "Search"}
                  </Button>
                </div>
              </form>

              {foundUser && (
                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{foundUser.name || foundUser.username}</div>
                      <div className="text-xs font-mono text-muted-foreground">@{foundUser.username}</div>
                    </div>
                    <Button
                      size="sm"
                      disabled={requestBusy}
                      onClick={() => handleSendRequest(foundUser.id, foundUser.username)}
                      className="gap-1.5"
                    >
                      <UserPlus className="size-3.5" />
                      {requestBusy ? "Sending..." : "Send Duo Request"}
                    </Button>
                  </div>
                </div>
              )}

              <div className="mt-6 rounded-lg border border-dashed border-border p-4 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Your username for your friend:</p>
                <code className="rounded bg-muted px-2 py-1 font-mono text-primary text-sm font-semibold">
                  @{myProfile?.username || "set_in_onboarding"}
                </code>
                <p className="mt-2">Tell your friend to search this exact username on their Duo page.</p>
              </div>
            </CardContent>
          </Card>

          {/* INCOMING & OUTGOING REQUESTS */}
          <div className="space-y-6">
            {/* Incoming Requests */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Incoming Duo Requests</span>
                  {incoming.length > 0 && <Badge>{incoming.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {incoming.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No pending requests from other users.</p>
                ) : (
                  <div className="space-y-2.5">
                    {incoming.map((req) => {
                      const sender = pendingProfiles?.[req.requester_id];
                      return (
                        <div
                          key={req.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                        >
                          <div>
                            <div className="text-sm font-medium">{sender?.name || "Duo Learner"}</div>
                            <div className="text-xs font-mono text-muted-foreground">
                              @{sender?.username || "user"} · {sender?.preferred_language || "C++"}
                            </div>
                          </div>
                          <div className="flex gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRespond(req.id, false)}
                              className="size-8 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <X className="size-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRespond(req.id, true)}
                              className="size-8 p-0"
                            >
                              <Check className="size-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Outgoing Requests */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Sent Requests (Waiting for Acceptance)</span>
                  {outgoing.length > 0 && <Badge variant="secondary">{outgoing.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {outgoing.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No pending outgoing requests.</p>
                ) : (
                  <div className="space-y-2.5">
                    {outgoing.map((req) => {
                      const addressee = pendingProfiles?.[req.addressee_id];
                      return (
                        <div
                          key={req.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                        >
                          <div>
                            <div className="text-sm font-medium">{addressee?.name || "Friend"}</div>
                            <div className="text-xs font-mono text-muted-foreground">
                              @{addressee?.username || "username"} (Pending)
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRespond(req.id, false)}
                            className="text-xs text-destructive hover:bg-destructive/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
