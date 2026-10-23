import "server-only";
import { getLessonCards } from "@/app/lessons/lesson";
import { overallScore } from "./grade";
import { isLessonId } from "./lesson-ids";
import { DIFFICULTIES, ENGLISH_LEVELS, WEEKLY_GOAL, type Difficulty, type EnglishLevel } from "./learning";
import { buildLearningPath, type ActivityRow, type PathStatus } from "./learning-path";
import type { SupabaseServerClient } from "./supabase/server";
import type { Feedback } from "./validate-feedback";

// All queries run as the signed-in user, so RLS limits them to that user's rows.
// user_id defaults to auth.uid() in the database and is never taken from the client.

export type Profile = {
  id: string;
  display_name: string | null;
  english_level: EnglishLevel | null;
  preferred_difficulty: Difficulty;
  weekly_goal_minutes: number;
};

export type StoredPathItem = { lesson_id: string; position: number; status: PathStatus; reason: string };

const DAY = 24 * 60 * 60 * 1000;
const oneOf = <T extends string>(values: readonly T[], value: unknown): value is T => values.includes(value as T);

// Message only: never log student data.
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
    english_level: oneOf(ENGLISH_LEVELS, data.english_level) ? data.english_level : null,
    preferred_difficulty: oneOf(DIFFICULTIES, data.preferred_difficulty) ? data.preferred_difficulty : "intermediate",
    weekly_goal_minutes: Number.isInteger(data.weekly_goal_minutes) ? data.weekly_goal_minutes : WEEKLY_GOAL.default,
  };
}

export async function getActivity(supabase: SupabaseServerClient, days = 90): Promise<ActivityRow[] | null> {
  const { data, error } = await supabase
    .from("learning_activity")
    .select("id, activity_type, reference_id, score, max_score, duration_seconds, mistake_counts, created_at")
    .gte("created_at", new Date(Date.now() - days * DAY).toISOString())
    .order("created_at", { ascending: false })
    .limit(500);
  logError("activity read", error);
  if (error) return null;

  const toNumber = (value: unknown) => (value === null ? null : Number(value));
  return (data ?? []).map((row) => ({ ...row, score: toNumber(row.score), max_score: toNumber(row.max_score) })) as ActivityRow[];
}

export async function getLearningPath(supabase: SupabaseServerClient): Promise<StoredPathItem[] | null> {
  const { data, error } = await supabase.from("learning_path_items").select("lesson_id, position, status, reason").order("position");
  logError("path read", error);
  if (error) return null;
  return (data ?? []).filter((item) => isLessonId(item.lesson_id)) as StoredPathItem[];
}

export async function refreshLearningPath(supabase: SupabaseServerClient, userId: string) {
  const [profile, activity] = await Promise.all([getProfile(supabase, userId), getActivity(supabase)]);
  if (!activity) return;

  const items = buildLearningPath(
    getLessonCards().map(({ id, title }) => ({ id, title })),
    activity,
    { englishLevel: profile?.english_level ?? null, preferredDifficulty: profile?.preferred_difficulty ?? "intermediate" },
  );

  if (items.length > 0) {
    const rows = items.map(({ lessonId, status, reason }, position) => ({ user_id: userId, lesson_id: lessonId, position, status, reason }));
    const { error } = await supabase.from("learning_path_items").upsert(rows, { onConflict: "user_id,lesson_id" });
    logError("path save", error);
    if (error) return;
  }

  let stale = supabase.from("learning_path_items").delete().eq("user_id", userId);
  if (items.length > 0) stale = stale.not("lesson_id", "in", `(${items.map(({ lessonId }) => `"${lessonId}"`).join(",")})`);
  const { error } = await stale;
  logError("path cleanup", error);
}

// Stores mistake counts per rule and the grade only, never the essay text.
export async function recordEssayCheck(supabase: SupabaseServerClient, userId: string, feedback: Feedback) {
  const counts: Record<string, number> = {};
  for (const { rule } of feedback.mistakes) counts[rule] = (counts[rule] ?? 0) + 1;

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
