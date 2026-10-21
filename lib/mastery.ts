// How well a student knows each lesson, from their own saved quizzes and
// essay checks. Plain rules (no AI), so each level can be explained:
//   Not started  no quiz yet
//   Learning     best quiz under 50%
//   Practicing   best quiz 50-74%
//   Passed       best quiz 75%+ (the same line as "lesson passed")
//   Mastered     2+ quizzes of 7+ questions at 90%+, and the rule didn't
//                come up in the recent essay checks
// Pure functions, safe to use in the browser.

import { PASS_SHARE } from "./learning";
import { quizResults, recentMistakes, type ActivityRow } from "./learning-path";

export const MASTERY_LEVELS = ["not-started", "learning", "practicing", "passed", "mastered"] as const;
export type MasteryLevel = (typeof MASTERY_LEVELS)[number];

export const MASTERY_LABELS: Record<MasteryLevel, string> = {
  "not-started": "Not started",
  learning: "Learning",
  practicing: "Practicing",
  passed: "Passed",
  mastered: "Mastered",
};

// What it takes to reach the next level, shown under each lesson.
export const MASTERY_NEXT_STEP: Record<MasteryLevel, string> = {
  "not-started": "Take the quiz to start.",
  learning: "Get 50% or more on a quiz.",
  practicing: "Get 75% or more to pass.",
  passed: "Get 90%+ twice on quizzes of 7+ questions, with no mistakes on this rule in recent essays.",
  mastered: "You know this rule. Keep using it in your writing!",
};

// Steps filled in the small meter next to each level (0-4).
export const MASTERY_STEPS: Record<MasteryLevel, number> = {
  "not-started": 0,
  learning: 1,
  practicing: 2,
  passed: 3,
  mastered: 4,
};

const MASTERY_SHARE = 0.9;
const MASTERY_MIN_QUESTIONS = 7;
const MASTERY_QUIZZES = 2;

export type LessonMastery = { level: MasteryLevel; best: number | null; attempts: number };

export function masteryByLesson(lessonIds: string[], activity: ActivityRow[]): Record<string, LessonMastery> {
  const results = quizResults(activity);
  const { byLesson: essayMistakes } = recentMistakes(activity);
  const strongQuizzes = new Map<string, number>();
  for (const row of activity) {
    if (row.activity_type !== "quiz_completed" || !row.reference_id || !row.max_score) continue;
    if (row.max_score >= MASTERY_MIN_QUESTIONS && (row.score ?? 0) / row.max_score >= MASTERY_SHARE) {
      strongQuizzes.set(row.reference_id, (strongQuizzes.get(row.reference_id) ?? 0) + 1);
    }
  }

  const mastery: Record<string, LessonMastery> = {};
  for (const id of lessonIds) {
    const result = results.get(id);
    let level: MasteryLevel = "not-started";
    if (result) {
      if (result.best < 0.5) level = "learning";
      else if (result.best < PASS_SHARE) level = "practicing";
      else if ((strongQuizzes.get(id) ?? 0) >= MASTERY_QUIZZES && !essayMistakes.has(id)) level = "mastered";
      else level = "passed";
    }
    mastery[id] = { level, best: result?.best ?? null, attempts: result?.attempts ?? 0 };
  }
  return mastery;
}
