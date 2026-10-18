import { isLessonId, type LessonId } from "./lesson-ids";
import { MAX_MISTAKES } from "./limits";

// Matches the "Feedback response" contract in CLAUDE.md.
export type Mistake = {
  original: string;
  fix: string;
  rule: LessonId | "other";
  why: string;
};

export type Feedback = {
  mistakes: Mistake[];
  summary: string;
};

// Checks that data from Claude has the right shape. Returns clean feedback,
// or null if something important is missing or the wrong type.
export function validateFeedback(data: unknown): Feedback | null {
  if (typeof data !== "object" || data === null) return null;

  const { mistakes, summary } = data as Record<string, unknown>;
  if (typeof summary !== "string" || summary.trim() === "") return null;
  if (!Array.isArray(mistakes)) return null;

  const cleaned: Mistake[] = [];
  // Claude lists the most important mistakes first, so keep the first few.
  for (const item of mistakes.slice(0, MAX_MISTAKES)) {
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

  return { mistakes: cleaned, summary };
}
