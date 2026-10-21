// Shared words and numbers for accounts, settings and the learning path.
// Plain data, safe to use in the browser.

export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ENGLISH_LEVELS = [
  "beginner",
  "elementary",
  "intermediate",
  "upper-intermediate",
  "advanced",
] as const;
export type EnglishLevel = (typeof ENGLISH_LEVELS)[number];

export const LEVEL_LABELS: Record<EnglishLevel, string> = {
  beginner: "Beginner",
  elementary: "Elementary",
  intermediate: "Intermediate",
  "upper-intermediate": "Upper-Intermediate",
  advanced: "Advanced",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// What each preferred difficulty changes, shown on the Settings page so the
// setting is never just a label.
export const DIFFICULTY_EFFECTS: Record<Difficulty, string> = {
  beginner: "Quizzes start at 5 questions, and your learning path adds easier lessons first.",
  intermediate: "Quizzes start at 7 questions, and your learning path adds lessons at your level.",
  advanced: "Quizzes start at 10 questions, and your learning path adds harder lessons first.",
};

// How many quiz questions the slider starts at for each preferred difficulty.
// The student can still move it (3-10).
export const QUIZ_LENGTH_BY_DIFFICULTY: Record<Difficulty, number> = {
  beginner: 5,
  intermediate: 7,
  advanced: 10,
};

// How hard each lesson is. A proposal by Claude Code (2026-10-21) for the
// team to check and change: lesson metadata, not lesson content, so the
// lessons.json contract stays the same. A lesson missing here counts as
// intermediate.
export const LESSON_DIFFICULTY: Record<string, Difficulty> = {
  "present-simple": "beginner",
  "present-continuous": "beginner",
  "past-simple": "beginner",
  articles: "beginner",
  plurals: "beginner",
  "prepositions-in-on-at": "beginner",
  "past-continuous": "intermediate",
  future: "intermediate",
  "subject-verb-agreement": "intermediate",
  "question-word-order": "intermediate",
  "present-perfect": "advanced",
  "past-perfect": "advanced",
};

export function lessonDifficulty(lessonId: string): Difficulty {
  return LESSON_DIFFICULTY[lessonId] ?? "intermediate";
}

// A quiz counts as a completed lesson at 75% or more right, the same line
// the quiz's "So close!" score message uses.
export const PASS_SHARE = 0.75;

export const WEEKLY_GOAL = { min: 10, max: 600, default: 60 } as const;
