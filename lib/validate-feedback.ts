import { isLessonId, type LessonId } from "./lesson-ids";
import { MAX_MISTAKES_BY_MODE, type FeedbackMode } from "./limits";

export type Mistake = {
  original: string;
  fix: string;
  rule: LessonId | "other";
  why: string;
};

export type Grade = {
  grammar: number;
  vocabulary: number;
  organization: number;
  clarity: number;
};

export type Feedback = {
  mistakes: Mistake[];
  summary: string;
  grade?: Grade | null;
};

export const GRADE_AREAS = ["grammar", "vocabulary", "organization", "clarity"] as const;

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

export function validateFeedback(data: unknown, mode: FeedbackMode): Feedback | null {
  if (typeof data !== "object" || data === null) return null;

  const { mistakes, summary, grade } = data as Record<string, unknown>;
  if (typeof summary !== "string" || summary.trim() === "") return null;
  if (!Array.isArray(mistakes)) return null;

  const cleaned: Mistake[] = [];
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

  if (mode === "practice") return { mistakes: cleaned, summary };

  const cleanGrade = validateGrade(grade);
  if (cleanGrade === undefined) return null;
  return { mistakes: cleaned, summary, grade: cleanGrade };
}
