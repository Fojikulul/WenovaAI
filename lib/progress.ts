import "server-only";
import { getLessonCards } from "@/app/lessons/lesson";
import { overallScore } from "./grade";
import { isLessonId } from "./lesson-ids";
import {
  DIFFICULTIES,
  ENGLISH_LEVELS,
  WEEKLY_GOAL,
  type Difficulty,
  type EnglishLevel,
} from "./learning";
import { buildLearningPath, type ActivityRow, type PathStatus } from "./learning-path";
import type { SupabaseServerClient } from "./supabase/server";
import type { Feedback } from "./validate-feedback";

// user_id is filled in by the database (default auth.uid()), never taken from the browser.

export type Profile = {
  id: string;
  display_name: string | null;
  english_level: EnglishLevel | null;
  preferred_difficulty: Difficulty;
  weekly_goal_minutes: number;
};

export type StoredPathItem = {
  lesson_id: string;
  position: number;
  status: PathStatus;
  reason: string;
};

// Errors are reported with their message only, never with student data.
function logError(where: string, error: { message: string } | null) {
  if (error) console.error(`Supabase ${where} failed: ${error.message}`);
}

export async function getProfile(supabase: SupabaseServerClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, english_level, preferred_difficulty, weekly_goal_minutes")
    .eq("id", userId)
    .maybeSingle();
  logError("profile read", error);
  if (!data) return null;
  return {
    id: data.id,
    display_name: data.display_name,
    english_level: (ENGLISH_LEVELS as readonly string[]).includes(data.english_level) ? data.english_level : null,
    preferred_difficulty: (DIFFICULTIES as readonly string[]).includes(data.preferred_difficulty)
      ? data.preferred_difficulty
      : "intermediate",
    weekly_goal_minutes: Number.isInteger(data.weekly_goal_minutes)
      ? data.weekly_goal_minutes
      : WEEKLY_GOAL.default,
  };
}

export async function getActivity(supabase: SupabaseServerClient, days = 90): Promise<ActivityRow[] | null> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("learning_activity")
    .select("id, activity_type, reference_id, score, max_score, duration_seconds, mistake_counts, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(500);
  logError("activity read", error);
  if (error) return null;
  return (data ?? []).map((row) => ({
    ...row,
    score: row.score === null ? null : Number(row.score),
    max_score: row.max_score === null ? null : Number(row.max_score),
  })) as ActivityRow[];
}

export async function getLearningPath(supabase: SupabaseServerClient): Promise<StoredPathItem[] | null> {
  const { data, error } = await supabase
    .from("learning_path_items")
    .select("lesson_id, position, status, reason")
    .order("position");
  logError("path read", error);
  if (error) return null;
  return (data ?? []).filter((item) => isLessonId(item.lesson_id)) as StoredPathItem[];
}

export async function refreshLearningPath(supabase: SupabaseServerClient, userId: string) {
  const [profile, activity] = await Promise.all([getProfile(supabase, userId), getActivity(supabase)]);
  if (!activity) return;
  const lessons = getLessonCards().map((card) => ({ id: card.id, title: card.title }));
  const items = buildLearningPath(lessons, activity, {
    englishLevel: profile?.english_level ?? null,
    preferredDifficulty: profile?.preferred_difficulty ?? "intermediate",
  });

  const rows = items.map((item, position) => ({
    user_id: userId,
    lesson_id: item.lessonId,
    position,
    status: item.status,
    reason: item.reason,
  }));
  if (rows.length > 0) {
    const { error } = await supabase.from("learning_path_items").upsert(rows, { onConflict: "user_id,lesson_id" });
    logError("path save", error);
    if (error) return;
  }
  const keep = items.map((item) => item.lessonId);
  let remove = supabase.from("learning_path_items").delete().eq("user_id", userId);
  if (keep.length > 0) remove = remove.not("lesson_id", "in", `(${keep.map((id) => `"${id}"`).join(",")})`);
  const { error } = await remove;
  logError("path cleanup", error);
}

// Only mistake counts per lesson and the practice estimate are saved, never the essay or its words.
export async function recordEssayCheck(supabase: SupabaseServerClient, userId: string, feedback: Feedback) {
  const counts: Record<string, number> = {};
  for (const mistake of feedback.mistakes) {
    counts[mistake.rule] = (counts[mistake.rule] ?? 0) + 1;
  }
  const { error } = await supabase.from("learning_activity").insert({
    activity_type: "essay_check",
    score: feedback.grade ? overallScore(feedback.grade) : null,
    max_score: feedback.grade ? 5 : null,
    mistake_counts: counts,
  });
  logError("essay check save", error);
  if (!error) await refreshLearningPath(supabase, userId);
}

export async function recordQuiz(
  supabase: SupabaseServerClient,
  userId: string,
  quiz: { lessonId: string; score: number; total: number; durationSeconds: number },
) {
  const { error } = await supabase.from("learning_activity").insert({
    activity_type: "quiz_completed",
    reference_id: quiz.lessonId,
    score: quiz.score,
    max_score: quiz.total,
    duration_seconds: quiz.durationSeconds,
  });
  logError("quiz save", error);
  if (error) return false;
  await refreshLearningPath(supabase, userId);
  return true;
}
