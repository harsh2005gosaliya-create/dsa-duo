import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "./constants";
import type { Problem } from "./types";

export type SharedProblem = {
  id: string;
  from_user: string;
  to_user: string;
  problem_id: string;
  share_date: string;
  message: string | null;
  status: string;
  created_at: string;
  problem?: Problem | null;
};

export type Submission = {
  id: string;
  user_id: string;
  problem_id: string;
  language: string;
  code: string;
  intuition: string | null;
  approach: string | null;
  time_complexity: string | null;
  space_complexity: string | null;
  created_at: string;
  updated_at: string;
};

export type DiscussionMessage = {
  id: string;
  user_id: string;
  problem_id: string;
  body: string;
  created_at: string;
};

/** Send a problem to your duo partner for a given day (defaults to tomorrow's session). */
export async function shareProblem(input: {
  fromUser: string;
  toUser: string;
  problemId: string;
  message?: string;
  shareDate?: string;
}) {
  const { error } = await supabase.from("shared_problems").upsert(
    {
      from_user: input.fromUser,
      to_user: input.toUser,
      problem_id: input.problemId,
      share_date: input.shareDate ?? todayISO(),
      message: input.message?.trim() || null,
    },
    { onConflict: "from_user,to_user,problem_id,share_date" },
  );
  if (error) throw error;

  await supabase.from("activity_logs").insert({
    user_id: input.fromUser,
    kind: "shared",
    message: "Shared a problem with your duo partner",
    meta: { problem_id: input.problemId },
  });
}

export async function setShareStatus(id: string, status: string) {
  const { error } = await supabase.from("shared_problems").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function removeShare(id: string) {
  const { error } = await supabase.from("shared_problems").delete().eq("id", id);
  if (error) throw error;
}

/** Save (or update) your code + intuition for a problem. */
export async function saveSubmission(input: {
  id?: string;
  userId: string;
  problemId: string;
  language: string;
  code: string;
  intuition: string;
  approach: string;
  timeComplexity: string;
  spaceComplexity: string;
}) {
  const row = {
    user_id: input.userId,
    problem_id: input.problemId,
    language: input.language,
    code: input.code,
    intuition: input.intuition.trim() || null,
    approach: input.approach.trim() || null,
    time_complexity: input.timeComplexity.trim() || null,
    space_complexity: input.spaceComplexity.trim() || null,
  };
  if (input.id) {
    const { error } = await supabase.from("submissions").update(row).eq("id", input.id);
    if (error) throw error;
    return input.id;
  }
  const { data, error } = await supabase.from("submissions").insert(row).select("id").single();
  if (error) throw error;
  return data.id as string;
}

export async function deleteSubmission(id: string) {
  const { error } = await supabase.from("submissions").delete().eq("id", id);
  if (error) throw error;
}

export async function postDiscussion(userId: string, problemId: string, body: string) {
  const { error } = await supabase
    .from("discussions")
    .insert({ user_id: userId, problem_id: problemId, body: body.trim() });
  if (error) throw error;
}

/** Send a friend request by username. */
export async function requestFriend(myId: string, username: string) {
  const { data, error } = await supabase.rpc("find_user_by_username", { uname: username.trim() });
  if (error) throw error;
  const match = (data ?? [])[0];
  if (!match) throw new Error("No one found with that username.");
  const { error: insErr } = await supabase
    .from("friendships")
    .insert({ requester_id: myId, addressee_id: match.id });
  if (insErr) throw insErr;
  return match;
}

export async function respondToFriendRequest(id: string, accept: boolean) {
  if (accept) {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("friendships").delete().eq("id", id);
    if (error) throw error;
  }
}

export async function sendSignal(fromUser: string, toUser: string, kind: string, payload: string) {
  const { error } = await supabase
    .from("duo_signals")
    .insert({ from_user: fromUser, to_user: toUser, kind, payload });
  if (error) throw error;
}
