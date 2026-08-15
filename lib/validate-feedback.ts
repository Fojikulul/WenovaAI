export type Mistake = {
  original: string;
  fix: string;
  why: string;
};

export type Feedback = {
  mistakes: Mistake[];
  summary: string;
};

const MAX_MISTAKES = 10;

export function validateFeedback(data: unknown): Feedback | null {
  if (typeof data !== "object" || data === null) return null;

  const { mistakes, summary } = data as Record<string, unknown>;
  if (typeof summary !== "string" || summary.trim() === "") return null;
  if (!Array.isArray(mistakes)) return null;

  const cleaned: Mistake[] = [];
  for (const item of mistakes.slice(0, MAX_MISTAKES)) {
    if (typeof item !== "object" || item === null) return null;

    const { original, fix, why } = item as Record<string, unknown>;
    if (typeof original !== "string" || typeof fix !== "string" || typeof why !== "string") {
      return null;
    }
    cleaned.push({ original, fix, why });
  }

  return { mistakes: cleaned, summary };
}
