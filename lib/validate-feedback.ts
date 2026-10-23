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
  grade?: Grade | null; // null: the text wasn't English, so it has no grade
};

export const GRADE_AREAS = ["grammar", "vocabulary", "organization", "clarity"] as const;

const isString = (value: unknown): value is string => typeof value === "string";
const isScore = (value: unknown) => Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 5;

// undefined = malformed, null = no grade
function validateGrade(data: unknown): Grade | null | undefined {
  if (data === null) return null;
  if (typeof data !== "object") return undefined;
  const grade = data as Record<string, unknown>;
  if (!GRADE_AREAS.every((area) => isScore(grade[area]))) return undefined;
  return Object.fromEntries(GRADE_AREAS.map((area) => [area, grade[area]])) as Grade;
}

export function validateFeedback(data: unknown, mode: FeedbackMode): Feedback | null {
  if (typeof data !== "object" || data === null) return null;
  const { mistakes, summary, grade } = data as Record<string, unknown>;
  if (!isString(summary) || !summary.trim() || !Array.isArray(mistakes)) return null;

  const cleaned: Mistake[] = [];
  for (const item of mistakes.slice(0, MAX_MISTAKES_BY_MODE[mode])) {
    if (typeof item !== "object" || item === null) return null;
    const { original, fix, rule, why } = item as Record<string, unknown>;
    if (!isString(original) || !isString(fix) || !isString(rule) || !isString(why)) return null;
    if (fix.trim() === original.trim()) continue; // the model sometimes lists correct text as "no change"
    cleaned.push({ original, fix, rule: isLessonId(rule) ? rule : "other", why });
  }

  if (mode === "practice") return { mistakes: cleaned, summary };
  const cleanGrade = validateGrade(grade);
  return cleanGrade === undefined ? null : { mistakes: cleaned, summary, grade: cleanGrade };
}

// Keeps a mistake only if its text appears exactly once and doesn't overlap an earlier one,
// so a bad model response drops a highlight instead of breaking the rendering.
export function keepFindableMistakes(mistakes: Mistake[], text: string): Mistake[] {
  const kept: { start: number; end: number }[] = [];
  return mistakes.filter(({ original }) => {
    const start = text.indexOf(original);
    if (!original || start === -1 || text.indexOf(original, start + 1) !== -1) return false;
    const end = start + original.length;
    if (kept.some((range) => start < range.end && range.start < end)) return false;
    kept.push({ start, end });
    return true;
  });
}
