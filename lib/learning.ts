export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ENGLISH_LEVELS = ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced"] as const;
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

export const DIFFICULTY_EFFECTS: Record<Difficulty, string> = {
  beginner: "Quizzes start at 5 questions, and your learning path adds easier lessons first.",
  intermediate: "Quizzes start at 7 questions, and your learning path adds lessons at your level.",
  advanced: "Quizzes start at 10 questions, and your learning path adds harder lessons first.",
};

export const QUIZ_LENGTH_BY_DIFFICULTY: Record<Difficulty, number> = {
  beginner: 5,
  intermediate: 7,
  advanced: 10,
};

// Drafted by Claude Code, approved by Vasyl (2026-10-21). Unlisted lessons count as intermediate.
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

export const lessonDifficulty = (lessonId: string): Difficulty => LESSON_DIFFICULTY[lessonId] ?? "intermediate";

export const PASS_SHARE = 0.75;

export const WEEKLY_GOAL = { min: 10, max: 600, default: 60 } as const;
