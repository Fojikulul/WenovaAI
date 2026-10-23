"use server";

import { getLesson, getLessons } from "@/app/lessons/lesson";
import { QUIZ_LENGTH_BY_DIFFICULTY } from "./learning";
import { masteryByLesson, type MasteryLevel } from "./mastery";
import { getActivity, getProfile, recordQuiz } from "./progress";
import { getSignedIn } from "./supabase/server";

export type QuizSaveResult = "saved" | "signed-out" | "failed";

const MAX_QUIZ_SECONDS = 3600;

// Client input is re-validated here; the user always comes from the session cookie.
export async function saveQuizResult(lessonId: string, score: number, total: number, durationSeconds: number): Promise<QuizSaveResult> {
  const lesson = getLesson(lessonId);
  const valid =
    lesson &&
    Number.isInteger(score) &&
    Number.isInteger(total) &&
    total >= 1 &&
    total <= lesson.practice.length &&
    score >= 0 &&
    score <= total &&
    Number.isFinite(durationSeconds);
  if (!valid) return "failed";

  const signedIn = await getSignedIn();
  if (!signedIn) return "signed-out";

  const saved = await recordQuiz(signedIn.supabase, signedIn.user.id, {
    lessonId,
    score,
    total,
    durationSeconds: Math.max(0, Math.min(MAX_QUIZ_SECONDS, Math.round(durationSeconds))),
  });
  return saved ? "saved" : "failed";
}

export async function getPreferredQuizLength(): Promise<number | null> {
  const signedIn = await getSignedIn();
  if (!signedIn) return null;
  const profile = await getProfile(signedIn.supabase, signedIn.user.id);
  return profile ? QUIZ_LENGTH_BY_DIFFICULTY[profile.preferred_difficulty] : null;
}

export async function getMyMastery(): Promise<Record<string, MasteryLevel> | null> {
  const signedIn = await getSignedIn();
  const activity = signedIn && (await getActivity(signedIn.supabase));
  if (!activity) return null;
  const mastery = masteryByLesson(getLessons().map(({ id }) => id), activity);
  return Object.fromEntries(Object.entries(mastery).map(([id, { level }]) => [id, level]));
}
