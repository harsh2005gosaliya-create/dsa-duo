import { supabase } from "@/integrations/supabase/client";
import { addDaysISO, todayISO } from "./constants";
import { computeStreaks, isSolved, nextReviewInterval, weakAreas } from "./metrics";
import type { Attempt, Mistake, Problem, Review } from "./types";

const PROBLEM_SELECT =
  "id,created_by,title,platform,url,difficulty,topic,subtopic,pattern,tags,estimated_time,description,is_seed,created_at";

/** Build (or fetch) today's 3-problem mission for a user. */
export async function ensureTodayMission(opts: {
  userId: string;
  target: number;
  attempts: Attempt[];
  reviews: Review[];
  mistakes: Mistake[];
}) {
  const { userId, target, attempts, reviews, mistakes } = opts;
  const date = todayISO();

  const existing = await supabase
    .from("daily_missions")
    .select("id")
    .eq("user_id", userId)
    .eq("mission_date", date)
    .maybeSingle();
  if (existing.data) return existing.data.id as string;

  const { data: mission, error } = await supabase
    .from("daily_missions")
    .insert({ user_id: userId, mission_date: date, target })
    .select("id")
    .single();
  if (error) throw error;

  const picks = await pickMissionProblems({ userId, target, attempts, reviews, mistakes });
  if (picks.length) {
    await supabase.from("daily_mission_items").insert(
      picks.map((p, i) => ({
        mission_id: mission.id,
        user_id: userId,
        problem_id: p.problem.id,
        slot: i + 1,
        is_review: p.isReview,
      })),
    );
  }
  return mission.id as string;
}

export async function pickMissionProblems(opts: {
  userId: string;
  target: number;
  attempts: Attempt[];
  reviews: Review[];
  mistakes: Mistake[];
  exclude?: string[];
}) {
  const { target, attempts, reviews, mistakes, exclude = [] } = opts;
  const { data } = await supabase.from("problems").select(PROBLEM_SELECT).limit(500);
  const library = (data ?? []) as Problem[];

  const solvedIds = new Set(attempts.filter(isSolved).map((a) => a.problem_id));
  const recentIds = new Set(
    attempts.filter((a) => a.solved_on >= addDaysISO(todayISO(), -10)).map((a) => a.problem_id),
  );
  const failedIds = attempts.filter((a) => a.outcome === "failed").map((a) => a.problem_id);
  const weak = weakAreas(attempts, mistakes).slice(0, 3).map((w) => w.topic);
  const blocked = new Set(exclude);

  const chosen: { problem: Problem; isReview: boolean }[] = [];
  const take = (p: Problem | undefined, isReview: boolean) => {
    if (!p || chosen.some((c) => c.problem.id === p.id) || blocked.has(p.id)) return false;
    chosen.push({ problem: p, isReview });
    return true;
  };

  // 1. a due review, if any
  const dueReview = reviews.find((r) => r.status === "pending" && r.due_date <= todayISO());
  if (dueReview?.problem) take(dueReview.problem, true);

  // 2. a previously failed problem worth re-attacking
  const failed = library.find((p) => failedIds.includes(p.id) && !solvedIds.has(p.id));
  if (chosen.length < target) take(failed, true);

  const fresh = (pred: (p: Problem) => boolean) =>
    shuffle(library.filter((p) => !solvedIds.has(p.id) && !recentIds.has(p.id) && pred(p)))[0];

  const ladder: { diff: Problem["difficulty"]; weakFirst: boolean }[] = [
    { diff: "Easy", weakFirst: true },
    { diff: "Medium", weakFirst: true },
    { diff: "Medium", weakFirst: false },
    { diff: "Medium", weakFirst: false },
    { diff: "Hard", weakFirst: false },
  ];

  let li = 0;
  while (chosen.length < target && li < ladder.length + 3) {
    const rung = ladder[Math.min(li, ladder.length - 1)] ?? ladder[0]!;
    const weakPick = rung.weakFirst
      ? fresh((p) => p.difficulty === rung.diff && weak.includes(p.topic))
      : undefined;
    if (!take(weakPick, false)) {
      if (!take(fresh((p) => p.difficulty === rung.diff), false)) {
        take(fresh(() => true), false);
      }
    }
    li++;
  }
  return chosen.slice(0, target);
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i] as T;
    a[i] = a[j] as T;
    a[j] = tmp;
  }
  return a;
}

export type AttemptInput = {
  userId: string;
  problemId: string;
  outcome: Attempt["outcome"];
  isResolve: boolean;
  timeTaken: number;
  attemptsCount: number;
  confidence: number;
  difficultyFelt: number;
  hintsUsed: number;
  keyIdea: string;
  mistakeNote: string;
  timeComplexity: string;
  spaceComplexity: string;
  canResolveTomorrow: boolean;
  notes: string;
  mistakeCategories: string[];
  scheduleReview: boolean;
};

export async function logAttempt(input: AttemptInput) {
  const solved = input.outcome !== "failed";
  const { data: attempt, error } = await supabase
    .from("problem_attempts")
    .insert({
      user_id: input.userId,
      problem_id: input.problemId,
      outcome: input.outcome,
      is_resolve: input.isResolve,
      time_taken_min: input.timeTaken,
      attempts_count: input.attemptsCount,
      confidence: input.confidence,
      difficulty_felt: input.difficultyFelt,
      hints_used: input.hintsUsed,
      key_idea: input.keyIdea || null,
      mistake_note: input.mistakeNote || null,
      time_complexity: input.timeComplexity || null,
      space_complexity: input.spaceComplexity || null,
      can_resolve_tomorrow: input.canResolveTomorrow,
      notes: input.notes || null,
      solved_on: todayISO(),
    })
    .select("id")
    .single();
  if (error) throw error;

  if (input.mistakeCategories.length) {
    await supabase.from("mistakes").insert(
      input.mistakeCategories.map((category) => ({
        user_id: input.userId,
        attempt_id: attempt.id,
        problem_id: input.problemId,
        category,
        note: input.mistakeNote || null,
      })),
    );
  }

  // mastery state
  const { data: prev } = await supabase
    .from("user_problem_state")
    .select("*")
    .eq("user_id", input.userId)
    .eq("problem_id", input.problemId)
    .maybeSingle();

  const solvedCount = (prev?.solved_count ?? 0) + (solved ? 1 : 0);
  const failedCount = (prev?.failed_count ?? 0) + (solved ? 0 : 1);
  const mastery = deriveMastery({
    solved,
    isResolve: input.isResolve,
    confidence: input.confidence,
    solvedCount,
    outcome: input.outcome,
    canResolveTomorrow: input.canResolveTomorrow,
  });

  await supabase.from("user_problem_state").upsert({
    user_id: input.userId,
    problem_id: input.problemId,
    mastery,
    last_confidence: input.confidence,
    total_attempts: (prev?.total_attempts ?? 0) + 1,
    solved_count: solvedCount,
    failed_count: failedCount,
    last_activity_at: new Date().toISOString(),
  });

  // review scheduling
  if (input.scheduleReview && solved) {
    const days = nextReviewInterval(0, input.confidence);
    await supabase.from("problem_reviews").insert({
      user_id: input.userId,
      problem_id: input.problemId,
      due_date: addDaysISO(todayISO(), days),
      interval_index: 0,
    });
  }

  // mission auto-complete
  const { data: mission } = await supabase
    .from("daily_missions")
    .select("id")
    .eq("user_id", input.userId)
    .eq("mission_date", todayISO())
    .maybeSingle();
  if (mission && solved) {
    await supabase
      .from("daily_mission_items")
      .update({ completed: true })
      .eq("mission_id", mission.id)
      .eq("problem_id", input.problemId);
    await refreshMissionCount(mission.id);
  }

  await supabase.from("activity_logs").insert({
    user_id: input.userId,
    kind: solved ? "solved" : "failed",
    message: solved ? "Solved a problem" : "Attempted a problem",
    meta: { problem_id: input.problemId, outcome: input.outcome },
  });

  return attempt.id as string;
}

function deriveMastery(o: {
  solved: boolean;
  isResolve: boolean;
  confidence: number;
  solvedCount: number;
  outcome: Attempt["outcome"];
  canResolveTomorrow: boolean;
}): string {
  if (!o.solved) return "attempted";
  if (o.isResolve && o.confidence >= 4 && o.solvedCount >= 2) return "mastered";
  if (o.isResolve) return "resolved";
  if (o.outcome === "solved_independently" && o.confidence >= 4 && o.canResolveTomorrow)
    return "understood";
  return "solved";
}

export async function refreshMissionCount(missionId: string) {
  const { data } = await supabase
    .from("daily_mission_items")
    .select("completed")
    .eq("mission_id", missionId);
  const count = (data ?? []).filter((i) => i.completed).length;
  await supabase.from("daily_missions").update({ completed_count: count }).eq("id", missionId);
  return count;
}

export async function completeReview(
  review: Review,
  answers: {
    easier: boolean;
    remembered: boolean;
    timeTaken: number;
    confidence: number;
  },
) {
  await supabase
    .from("problem_reviews")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      easier: answers.easier,
      remembered_approach: answers.remembered,
      time_taken_min: answers.timeTaken,
      confidence_now: answers.confidence,
    })
    .eq("id", review.id);

  const days = nextReviewInterval(review.interval_index + 1, answers.confidence);
  await supabase.from("problem_reviews").insert({
    user_id: review.user_id,
    problem_id: review.problem_id,
    due_date: addDaysISO(todayISO(), days),
    interval_index: Math.min(review.interval_index + 1, 4),
  });
  return days;
}

/** Evaluate achievement rules and unlock any newly earned ones. Returns new codes. */
export async function syncAchievements(
  userId: string,
  data: { attempts: Attempt[]; reviews: Review[]; readinessScore: number; unlocked: string[] },
) {
  const { attempts, unlocked } = data;
  const solved = attempts.filter(isSolved);
  const { current, activeDays } = computeStreaks(attempts);
  const patterns = new Set(solved.map((a) => a.problem?.pattern).filter(Boolean));
  const earned: string[] = [];
  const check = (code: string, ok: boolean) => {
    if (ok && !unlocked.includes(code)) earned.push(code);
  };

  check("first_blood", solved.length >= 1);
  check("streak_3", current >= 3);
  check("streak_7", current >= 7);
  check("solved_50", solved.length >= 50);
  check("solved_100", solved.length >= 100);
  check("pattern_hunter", patterns.size >= 5);
  check("consistency_king", activeDays >= 30);
  check("resolver", attempts.filter((a) => a.is_resolve).length >= 25);
  check("no_hint_hero", solved.filter((a) => a.hints_used === 0).length >= 10);
  check("oa_ready", data.readinessScore >= 80);

  if (earned.length) {
    await supabase
      .from("user_achievements")
      .upsert(earned.map((code) => ({ user_id: userId, code })));
  }
  return earned;
}

export function toCSV(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0] ?? {});
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(
    "\n",
  );
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
