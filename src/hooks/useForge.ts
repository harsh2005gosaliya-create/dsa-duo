import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type {
  Attempt,
  MockOA,
  Mission,
  Mistake,
  Problem,
  ProblemState,
  Profile,
  Review,
} from "@/lib/types";
import { todayISO } from "@/lib/constants";

const PROBLEM_SELECT =
  "id,created_by,title,platform,url,difficulty,topic,subtopic,pattern,tags,estimated_time,description,is_seed,created_at";

export function useProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

/** All of the signed-in user's training data. Small per-user dataset, fetched once and derived from. */
export function useTraining() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["training", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [attempts, reviews, mistakes, states, mocks] = await Promise.all([
        supabase
          .from("problem_attempts")
          .select(`*, problem:problems(${PROBLEM_SELECT})`)
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("problem_reviews")
          .select(`*, problem:problems(${PROBLEM_SELECT})`)
          .eq("user_id", user!.id)
          .order("due_date", { ascending: true })
          .limit(500),
        supabase
          .from("mistakes")
          .select("*")
          .eq("user_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(500),
        supabase.from("user_problem_state").select("*").eq("user_id", user!.id).limit(1000),
        supabase
          .from("mock_oas")
          .select("*")
          .eq("user_id", user!.id)
          .order("started_at", { ascending: false })
          .limit(50),
      ]);
      const err =
        attempts.error || reviews.error || mistakes.error || states.error || mocks.error;
      if (err) throw err;
      return {
        attempts: (attempts.data ?? []) as unknown as Attempt[],
        reviews: (reviews.data ?? []) as unknown as Review[],
        mistakes: (mistakes.data ?? []) as unknown as Mistake[],
        states: (states.data ?? []) as unknown as ProblemState[],
        mocks: (mocks.data ?? []) as unknown as MockOA[],
      };
    },
  });
}

export function useTodayMission() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["mission", user?.id, todayISO()],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_missions")
        .select(`*, items:daily_mission_items(*, problem:problems(${PROBLEM_SELECT}))`)
        .eq("user_id", user!.id)
        .eq("mission_date", todayISO())
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as Mission | null;
    },
  });
}

export function useProblem(id: string) {
  return useQuery({
    queryKey: ["problem", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("problems")
        .select(PROBLEM_SELECT)
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as Problem | null;
    },
  });
}

export function useAchievements() {
  return useQuery({
    queryKey: ["achievement-defs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as { code: string; title: string; description: string; icon: string }[];
    },
  });
}

export function useUnlockedAchievements() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data as { code: string; unlocked_at: string }[];
    },
  });
}

export function useRoadmap() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["roadmap", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [phases, progress] = await Promise.all([
        supabase.from("roadmap_phases").select("*").order("phase_order"),
        supabase.from("user_phase_progress").select("*").eq("user_id", user!.id),
      ]);
      if (phases.error) throw phases.error;
      if (progress.error) throw progress.error;
      return {
        phases: phases.data as {
          id: string;
          phase_order: number;
          title: string;
          summary: string;
          topics: string[];
          checklist: string[];
        }[],
        progress: progress.data as {
          phase_id: string;
          checked: string[];
          started: boolean;
          completed: boolean;
        }[],
      };
    },
  });
}

export function useDuo() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["duo", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: friendships, error } = await supabase
        .from("friendships")
        .select("*")
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`);
      if (error) throw error;
      const accepted = (friendships ?? []).find((f) => f.status === "accepted");
      const friendId = accepted
        ? accepted.requester_id === user!.id
          ? accepted.addressee_id
          : accepted.requester_id
        : null;

      let friendProfile: Profile | null = null;
      let friendAttempts: Attempt[] = [];
      let friendMissions: Mission[] = [];
      if (friendId) {
        const [p, a, m] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", friendId).maybeSingle(),
          supabase
            .from("problem_attempts")
            .select(`*, problem:problems(${PROBLEM_SELECT})`)
            .eq("user_id", friendId)
            .order("created_at", { ascending: false })
            .limit(500),
          supabase
            .from("daily_missions")
            .select("*")
            .eq("user_id", friendId)
            .order("mission_date", { ascending: false })
            .limit(30),
        ]);
        friendProfile = (p.data ?? null) as Profile | null;
        friendAttempts = (a.data ?? []) as unknown as Attempt[];
        friendMissions = (m.data ?? []) as unknown as Mission[];
      }

      return {
        friendships: (friendships ?? []) as {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: string;
        }[],
        friendId,
        friendProfile,
        friendAttempts,
        friendMissions,
      };
    },
  });
}
