import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { DiscussionMessage, SharedProblem, Submission } from "@/lib/social";
import type { Profile } from "@/lib/types";

const PROBLEM_SELECT =
  "id,created_by,title,platform,url,difficulty,topic,subtopic,pattern,tags,estimated_time,description,is_seed,created_at";

/** Questions exchanged with your duo partner, both directions. */
export function useShares() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["shares", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("shared_problems")
        .select(`*, problem:problems(${PROBLEM_SELECT})`)
        .or(`from_user.eq.${user!.id},to_user.eq.${user!.id}`)
        .order("share_date", { ascending: false })
        .limit(300);
      if (error) throw error;
      const rows = (data ?? []) as unknown as SharedProblem[];
      return {
        all: rows,
        received: rows.filter((r) => r.to_user === user!.id),
        sent: rows.filter((r) => r.from_user === user!.id),
      };
    },
  });
}

/** Everything social attached to one problem: both people's code, notes and discussion. */
export function useProblemSocial(problemId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["problem-social", problemId, user?.id],
    enabled: !!problemId && !!user,
    queryFn: async () => {
      const [subs, disc, shares] = await Promise.all([
        supabase
          .from("submissions")
          .select("*")
          .eq("problem_id", problemId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("discussions")
          .select("*")
          .eq("problem_id", problemId!)
          .order("created_at", { ascending: true }),
        supabase
          .from("shared_problems")
          .select("*")
          .eq("problem_id", problemId!)
          .or(`from_user.eq.${user!.id},to_user.eq.${user!.id}`),
      ]);
      const err = subs.error || disc.error || shares.error;
      if (err) throw err;
      const submissions = (subs.data ?? []) as unknown as Submission[];
      return {
        mine: submissions.filter((s) => s.user_id === user!.id),
        friends: submissions.filter((s) => s.user_id !== user!.id),
        discussion: (disc.data ?? []) as unknown as DiscussionMessage[],
        shares: (shares.data ?? []) as unknown as SharedProblem[],
      };
    },
  });
}

/** Name lookup for me + my partner, so we can label who wrote what. */
export function useNames() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["names", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id,name,username");
      if (error) throw error;
      const map: Record<string, string> = {};
      for (const p of (data ?? []) as Pick<Profile, "id" | "name" | "username">[]) {
        map[p.id] = p.id === user!.id ? "You" : p.name || p.username || "Your partner";
      }
      return map;
    },
  });
}
