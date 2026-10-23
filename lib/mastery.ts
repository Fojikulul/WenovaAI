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

export const MASTERY_NEXT_STEP: Record<MasteryLevel, string> = {
  "not-started": "Take the quiz to start.",
  learning: "Get 50% or more on a quiz.",
  practicing: "Get 75% or more to pass.",
  passed: "Get 90%+ twice on quizzes of 7+ questions, with no mistakes on this rule in recent essays.",
  mastered: "You know this rule. Keep using it in your writing!",
};

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

function levelFor(best: number, strongQuizzes: number, missedInEssays: boolean): MasteryLevel {
  if (best < 0.5) return "learning";
  if (best < PASS_SHARE) return "practicing";
  return strongQuizzes >= MASTERY_QUIZZES && !missedInEssays ? "mastered" : "passed";
}

export function masteryByLesson(lessonIds: string[], activity: ActivityRow[]): Record<string, LessonMastery> {
  const results = quizResults(activity);
  const { byLesson: essayMistakes } = recentMistakes(activity);

  const strongQuizzes = new Map<string, number>();
  for (const { activity_type, reference_id, score, max_score } of activity) {
    if (activity_type !== "quiz_completed" || !reference_id || !max_score) continue;
    if (max_score >= MASTERY_MIN_QUESTIONS && (score ?? 0) / max_score >= MASTERY_SHARE) {
      strongQuizzes.set(reference_id, (strongQuizzes.get(reference_id) ?? 0) + 1);
    }
  }

  return Object.fromEntries(
    lessonIds.map((id) => {
      const result = results.get(id);
      const level = result ? levelFor(result.best, strongQuizzes.get(id) ?? 0, essayMistakes.has(id)) : "not-started";
      return [id, { level, best: result?.best ?? null, attempts: result?.attempts ?? 0 }];
    }),
  );
}
