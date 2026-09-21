export type Problem = {
  id: string;
  created_by: string | null;
  title: string;
  platform: string;
  url: string | null;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  subtopic: string | null;
  pattern: string | null;
  tags: string[];
  estimated_time: number;
  description: string | null;
  is_seed: boolean;
  created_at: string;
};

export type Outcome =
  | "solved_independently"
  | "solved_with_hint"
  | "solved_after_solution"
  | "failed";

export type Attempt = {
  id: string;
  user_id: string;
  problem_id: string;
  outcome: Outcome;
  is_resolve: boolean;
  time_taken_min: number;
  attempts_count: number;
  confidence: number;
  difficulty_felt: number;
  hints_used: number;
  key_idea: string | null;
  mistake_note: string | null;
  time_complexity: string | null;
  space_complexity: string | null;
  can_resolve_tomorrow: boolean;
  notes: string | null;
  solved_on: string;
  created_at: string;
  problem?: Problem | null;
};

export type Review = {
  id: string;
  user_id: string;
  problem_id: string;
  due_date: string;
  interval_index: number;
  status: "pending" | "completed" | "skipped";
  completed_at: string | null;
  easier: boolean | null;
  remembered_approach: boolean | null;
  time_taken_min: number | null;
  confidence_now: number | null;
  problem?: Problem | null;
};

export type Mistake = {
  id: string;
  user_id: string;
  problem_id: string | null;
  attempt_id: string | null;
  category: string;
  note: string | null;
  created_at: string;
};

export type MissionItem = {
  id: string;
  mission_id: string;
  user_id: string;
  problem_id: string;
  slot: number;
  completed: boolean;
  is_review: boolean;
  problem?: Problem | null;
};

export type Mission = {
  id: string;
  user_id: string;
  mission_date: string;
  target: number;
  completed_count: number;
  items?: MissionItem[];
};

export type Profile = {
  id: string;
  name: string;
  username: string | null;
  avatar_url: string | null;
  preferred_language: string;
  dsa_level: string;
  target_role: string;
  target_companies: string[];
  daily_target: number;
  interview_date: string | null;
  onboarded: boolean;
  theme: string;
  created_at: string;
};

export type ProblemState = {
  user_id: string;
  problem_id: string;
  mastery: "unseen" | "attempted" | "solved" | "understood" | "resolved" | "mastered";
  last_confidence: number | null;
  total_attempts: number;
  solved_count: number;
  failed_count: number;
  last_activity_at: string;
};

export type MockOA = {
  id: string;
  user_id: string;
  duration_min: number;
  difficulty_mode: string;
  started_at: string;
  finished_at: string | null;
  time_used_min: number | null;
  score: number | null;
  solved_count: number;
  total_count: number;
  status: "in_progress" | "completed" | "abandoned";
};
