"use server";

import { getLesson, getLessons } from "@/app/lessons/lesson";
import { QUIZ_LENGTH_BY_DIFFICULTY } from "./learning";
import { masteryByLesson, type MasteryLevel } from "./mastery";
import { getActivity, getProfile, recordQuiz } from "./progress";
import { getSignedIn } from "./supabase/server";

// Server actions the quiz calls. Everything from the browser is checked
// again here, and the student is always the one in the session cookie.

export type QuizSaveResult = "saved" | "signed-out" | "failed";

// Saves a finished quiz for a signed-in student. Called once, from the
// button that opens the score screen (not from an effect), so a quiz is
// never saved twice.
export async function saveQuizResult(
  lessonId: string,
  score: number,
  total: number,
  durationSeconds: number,
): Promise<QuizSaveResult> {
  const lesson = getLesson(lessonId);
  if (
    !lesson ||
    !Number.isInteger(score) ||
    !Number.isInteger(total) ||
    total < 1 ||
    total > lesson.practice.length ||
    score < 0 ||
    score > total ||
    !Number.isFinite(durationSeconds)
  ) {
    return "failed";
  }
  const signedIn = await getSignedIn();
  if (!signedIn) return "signed-out";
  const saved = await recordQuiz(signedIn.supabase, signedIn.user.id, {
    lessonId,
    score,
    total,
    // A quiz left open in a tab for hours shouldn't count as hours of practice.
    durationSeconds: Math.max(0, Math.min(3600, Math.round(durationSeconds))),
  });
  return saved ? "saved" : "failed";
}

// How many questions the slider should start at, from the student's
// preferred difficulty. null when signed out (the quiz uses its default).
export async function getPreferredQuizLength(): Promise<number | null> {
  const signedIn = await getSignedIn();
  if (!signedIn) return null;
  const profile = await getProfile(signedIn.supabase, signedIn.user.id);
  return profile ? QUIZ_LENGTH_BY_DIFFICULTY[profile.preferred_difficulty] : null;
}

// The signed-in student's mastery level for every lesson, for the badges on
// the lesson list and lesson pages. null when signed out or on an error.
export async function getMyMastery(): Promise<Record<string, MasteryLevel> | null> {
  const signedIn = await getSignedIn();
  if (!signedIn) return null;
  const activity = await getActivity(signedIn.supabase);
  if (!activity) return null;
  const mastery = masteryByLesson(
    getLessons().map((lesson) => lesson.id),
    activity,
  );
  return Object.fromEntries(Object.entries(mastery).map(([id, entry]) => [id, entry.level]));
}
