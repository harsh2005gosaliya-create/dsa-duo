import { addDaysISO, todayISO } from "./constants";
import type { Attempt, Mistake, Review } from "./types";

export const SOLVED_OUTCOMES: Attempt["outcome"][] = [
  "solved_independently",
  "solved_with_hint",
  "solved_after_solution",
];

export const isSolved = (a: Attempt) => a.outcome !== "failed";

export function activeDates(attempts: Attempt[]): Set<string> {
  const s = new Set<string>();
  attempts.forEach((a) => {
    if (isSolved(a)) s.add(a.solved_on);
  });
  return s;
}

export function dayCounts(attempts: Attempt[]): Record<string, number> {
  const map: Record<string, number> = {};
  attempts.forEach((a) => {
    if (!isSolved(a)) return;
    map[a.solved_on] = (map[a.solved_on] ?? 0) + 1;
  });
  return map;
}

export function computeStreaks(attempts: Attempt[]) {
  const dates = activeDates(attempts);
  const today = todayISO();
  let current = 0;
  let cursor = dates.has(today) ? today : addDaysISO(today, -1);
  while (dates.has(cursor)) {
    current++;
    cursor = addDaysISO(cursor, -1);
  }
  const sorted = [...dates].sort();
  let longest = 0;
  let run = 0;
  let prev = "";
  for (const d of sorted) {
    run = prev && addDaysISO(prev, 1) === d ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest, activeDays: dates.size };
}

export type TopicStat = {
  topic: string;
  attempted: number;
  solved: number;
  failed: number;
  firstTry: number;
  avgConfidence: number;
  avgTime: number;
  hints: number;
  accuracy: number;
  mastery: number;
  uniqueProblems: number;
};

export function topicStats(attempts: Attempt[]): TopicStat[] {
  const byTopic = new Map<string, Attempt[]>();
  attempts.forEach((a) => {
    const t = a.problem?.topic ?? "Unknown";
    if (!byTopic.has(t)) byTopic.set(t, []);
    byTopic.get(t)!.push(a);
  });
  const out: TopicStat[] = [];
  byTopic.forEach((list, topic) => {
    const solved = list.filter(isSolved).length;
    const independent = list.filter((a) => a.outcome === "solved_independently").length;
    const avgConfidence = avg(list.map((a) => a.confidence));
    const avgTime = avg(list.map((a) => a.time_taken_min).filter((n) => n > 0));
    const accuracy = list.length ? solved / list.length : 0;
    const unique = new Set(list.map((a) => a.problem_id)).size;
    // mastery blends accuracy, independence, confidence and volume
    const volume = Math.min(1, unique / 8);
    const mastery = Math.round(
      100 *
        (0.35 * accuracy +
          0.25 * (list.length ? independent / list.length : 0) +
          0.2 * (avgConfidence / 5) +
          0.2 * volume),
    );
    out.push({
      topic,
      attempted: list.length,
      solved,
      failed: list.length - solved,
      firstTry: independent,
      avgConfidence,
      avgTime,
      hints: list.reduce((s, a) => s + a.hints_used, 0),
      accuracy,
      mastery,
      uniqueProblems: unique,
    });
  });
  return out.sort((a, b) => b.attempted - a.attempted);
}

export type WeakArea = {
  topic: string;
  score: number;
  reasons: string[];
  recommendation: string;
  stat: TopicStat;
};

export function weakAreas(attempts: Attempt[], mistakes: Mistake[]): WeakArea[] {
  const stats = topicStats(attempts).filter((s) => s.attempted >= 2);
  const mistakesByTopic = new Map<string, number>();
  const problemTopic = new Map<string, string>();
  attempts.forEach((a) => {
    if (a.problem) problemTopic.set(a.problem_id, a.problem.topic);
  });
  mistakes.forEach((m) => {
    const t = m.problem_id ? problemTopic.get(m.problem_id) : undefined;
    if (t) mistakesByTopic.set(t, (mistakesByTopic.get(t) ?? 0) + 1);
  });

  return stats
    .map((s) => {
      const reasons: string[] = [];
      let score = 0;
      if (s.accuracy < 0.7) {
        reasons.push(`${s.failed}/${s.attempted} attempts failed`);
        score += (0.7 - s.accuracy) * 100;
      }
      if (s.avgConfidence < 3.5) {
        reasons.push(`average confidence ${s.avgConfidence.toFixed(1)}/5`);
        score += (3.5 - s.avgConfidence) * 12;
      }
      if (s.avgTime > 35) {
        reasons.push(`average time ${Math.round(s.avgTime)} min`);
        score += Math.min(25, (s.avgTime - 35) / 2);
      }
      const mc = mistakesByTopic.get(s.topic) ?? 0;
      if (mc >= 2) {
        reasons.push(`${mc} logged mistakes`);
        score += mc * 4;
      }
      if (s.hints > s.attempted) {
        reasons.push(`heavy hint usage (${s.hints} hints)`);
        score += 8;
      }
      return {
        topic: s.topic,
        score: Math.round(score),
        reasons,
        recommendation: recommendFor(s),
        stat: s,
      };
    })
    .filter((w) => w.reasons.length > 0)
    .sort((a, b) => b.score - a.score);
}

function recommendFor(s: TopicStat) {
  if (s.accuracy < 0.5)
    return `Stop adding new ${s.topic} problems. Re-solve your failed ones first, then do 3 easy ${s.topic} problems.`;
  if (s.avgConfidence < 3)
    return `You are solving ${s.topic} without conviction. Re-solve 2 problems from memory and write the key idea before coding.`;
  if (s.avgTime > 35)
    return `Accuracy on ${s.topic} is acceptable — now train speed. Attempt 3 mediums with a hard 25-minute timer.`;
  return `Reinforce ${s.topic} with 3 medium problems and schedule a day-7 review.`;
}

export type Readiness = {
  total: number;
  parts: { label: string; score: number; weight: number; hint: string }[];
  weakest: string;
};

export function readiness(
  attempts: Attempt[],
  reviews: Review[],
  mistakes: Mistake[],
  dailyTarget: number,
): Readiness {
  const { current } = computeStreaks(attempts);
  const last30 = attempts.filter((a) => a.solved_on >= addDaysISO(todayISO(), -30));
  const solved = attempts.filter(isSolved);

  const daysActive30 = new Set(last30.filter(isSolved).map((a) => a.solved_on)).size;
  const consistency = clamp(
    (daysActive30 / 30) * 70 + Math.min(30, current * 3),
  );

  const topics = topicStats(attempts);
  const coverage = clamp((topics.filter((t) => t.uniqueProblems >= 3).length / 16) * 100);

  const accuracy = attempts.length ? solved.length / attempts.length : 0;
  const independence = attempts.length
    ? attempts.filter((a) => a.outcome === "solved_independently").length / attempts.length
    : 0;
  const problemSolving = clamp(accuracy * 60 + independence * 40);

  const mediums = attempts.filter((a) => a.problem?.difficulty === "Medium");
  const mediumScore = mediums.length
    ? clamp(
        (mediums.filter(isSolved).length / mediums.length) * 70 +
          Math.min(30, mediums.length * 1.5),
      )
    : 0;

  const resolves = attempts.filter((a) => a.is_resolve);
  const doneReviews = reviews.filter((r) => r.status === "completed");
  const retention = clamp(
    Math.min(60, resolves.length * 4) + Math.min(40, doneReviews.length * 4),
  );

  const timed = solved.filter((a) => a.time_taken_min > 0);
  const avgTime = avg(timed.map((a) => a.time_taken_min));
  const speed = timed.length ? clamp(100 - Math.max(0, avgTime - 20) * 2.2) : 0;

  const recent = attempts.slice(0, 30);
  const recentMistakes = mistakes.filter(
    (m) => m.created_at >= new Date(Date.now() - 30 * 86400000).toISOString(),
  ).length;
  const mistakeScore = clamp(100 - recentMistakes * 5 - (recent.length ? 0 : 40));

  const parts = [
    { label: "Consistency", score: Math.round(consistency), weight: 20, hint: `${daysActive30} active days in the last 30` },
    { label: "Topic Coverage", score: Math.round(coverage), weight: 20, hint: `${topics.filter((t) => t.uniqueProblems >= 3).length} topics with real depth` },
    { label: "Problem Solving", score: Math.round(problemSolving), weight: 20, hint: `${Math.round(accuracy * 100)}% accuracy, ${Math.round(independence * 100)}% independent` },
    { label: "Medium Performance", score: Math.round(mediumScore), weight: 15, hint: `${mediums.length} medium attempts` },
    { label: "Retention", score: Math.round(retention), weight: 10, hint: `${resolves.length} re-solves, ${doneReviews.length} reviews done` },
    { label: "Speed", score: Math.round(speed), weight: 10, hint: timed.length ? `${Math.round(avgTime)} min average` : "no timed solves yet" },
    { label: "Mistake Control", score: Math.round(mistakeScore), weight: 5, hint: `${recentMistakes} mistakes logged in 30 days` },
  ];

  const total = Math.round(parts.reduce((s, p) => s + (p.score * p.weight) / 100, 0));
  const weakest = [...parts].sort((a, b) => a.score - b.score)[0]?.label ?? "Consistency";
  void dailyTarget;
  return { total, parts, weakest };
}

export function personalizedInsight(
  attempts: Attempt[],
  reviews: Review[],
  dailyTarget: number,
): string {
  const { current } = computeStreaks(attempts);
  const solved = attempts.filter(isSolved);
  const failed = attempts.filter((a) => a.outcome === "failed");
  const dueReviews = reviews.filter((r) => r.status === "pending" && r.due_date <= todayISO());
  const timed = solved.filter((a) => a.time_taken_min > 0);
  const avgTime = avg(timed.map((a) => a.time_taken_min));

  if (attempts.length === 0)
    return "Nothing logged yet. Add one problem and record what you actually understood — that is the whole system.";
  if (failed.length >= 5 && failed.length / attempts.length > 0.35)
    return "Stop adding new problems. Re-solve your failed ones first — unresolved failures are compounding.";
  if (dueReviews.length >= 3)
    return `${dueReviews.length} problems are due for review. Retention is worth more than fresh volume today.`;
  if (current === 0)
    return "Your biggest problem isn't DSA right now. It's consistency. One problem restarts the streak.";
  if (current >= 7 && avgTime > 35)
    return "Your accuracy is decent and your consistency is strong. Now train under time pressure.";
  if (current >= 7)
    return "You're on a strong consistency run. Shift focus from volume to depth — re-solve and explain.";
  return `Streak is alive at ${current} day${current === 1 ? "" : "s"}. Hit ${dailyTarget} today and keep the chain unbroken.`;
}

export function avg(nums: number[]) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}

export function nextReviewInterval(index: number, confidence: number) {
  const base = [1, 3, 7, 14, 30];
  let i = Math.min(index, base.length - 1);
  if (confidence <= 2) i = Math.max(0, i - 1);
  if (confidence >= 5) i = Math.min(base.length - 1, i + 1);
  return base[i];
}

export function greeting(d = new Date()) {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
