import { isLessonId, type LessonId } from "./lesson-ids";
import { MAX_MISTAKES_BY_MODE, type FeedbackMode } from "./limits";

// Matches the "Response from /api/feedback" contract in CLAUDE.md.
export type Mistake = {
  original: string;
  fix: string;
  rule: LessonId | "other";
  why: string;
};

// Essay mode only. Each score is a whole number from 1 to 5.
export type Grade = {
  grammar: number;
  vocabulary: number;
  organization: number;
  clarity: number;
};

export type Feedback = {
  mistakes: Mistake[];
  summary: string;
  // Essay mode only. null means the essay wasn't in English, so there's no grade.
  grade?: Grade | null;
};

const GRADE_AREAS = ["grammar", "vocabulary", "organization", "clarity"] as const;

// Checks the essay grade. Returns the clean grade, null for "no grade",
// or undefined if the grade is broken.
function validateGrade(data: unknown): Grade | null | undefined {
  if (data === null) return null;
  if (typeof data !== "object") return undefined;

  const grade = data as Record<string, unknown>;
  for (const area of GRADE_AREAS) {
    const score = grade[area];
    if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 5) {
      return undefined;
    }
  }
  const { grammar, vocabulary, organization, clarity } = grade as Grade;
  return { grammar, vocabulary, organization, clarity };
}

// Checks that data from Claude has the right shape. Returns clean feedback,
// or null if something important is missing or the wrong type.
export function validateFeedback(
  data: unknown,
  mode: FeedbackMode = "practice",
): Feedback | null {
  if (typeof data !== "object" || data === null) return null;

  const { mistakes, summary, grade } = data as Record<string, unknown>;
  if (typeof summary !== "string" || summary.trim() === "") return null;
  if (!Array.isArray(mistakes)) return null;

  const cleaned: Mistake[] = [];
  // Claude lists the most important mistakes first, so keep the first few.
  for (const item of mistakes.slice(0, MAX_MISTAKES_BY_MODE[mode])) {
    if (typeof item !== "object" || item === null) return null;

    const { original, fix, rule, why } = item as Record<string, unknown>;
    if (
      typeof original !== "string" ||
      typeof fix !== "string" ||
      typeof rule !== "string" ||
      typeof why !== "string"
    ) {
      return null;
    }

    // An unknown rule shouldn't break the page, so it becomes "other".
    cleaned.push({ original, fix, rule: isLessonId(rule) ? rule : "other", why });
  }

  // Practice mode never has a grade, so anything Claude sent is dropped.
  if (mode === "practice") return { mistakes: cleaned, summary };

  // Essay mode must have a grade, or null if the essay wasn't in English.
  const cleanGrade = validateGrade(grade);
  if (cleanGrade === undefined) return null;
  return { mistakes: cleaned, summary, grade: cleanGrade };
}
