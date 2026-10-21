import type { Grade } from "./validate-feedback";

// The four grade areas in the order they are shown. Typed with the keys of
// Grade, so the build fails if an area is renamed in the contract.
export const GRADE_AREA_LABELS: { key: keyof Grade; label: string }[] = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "organization", label: "Organization" },
  { key: "clarity", label: "Clarity" },
];

// The overall score is the average of the four areas, worked out here in
// code (CLAUDE.md: not by the AI), rounded to one decimal, e.g. 3.25 -> 3.3.
// Its own file (not in GradeCard) so server code can use it too.
export function overallScore(grade: Grade): number {
  const total = GRADE_AREA_LABELS.reduce((sum, area) => sum + grade[area.key], 0);
  return Math.round((total / GRADE_AREA_LABELS.length) * 10) / 10;
}
