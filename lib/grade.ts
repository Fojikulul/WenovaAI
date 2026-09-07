import type { Grade } from "./validate-feedback";

export const GRADE_AREA_LABELS: { key: keyof Grade; label: string }[] = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "organization", label: "Organization" },
  { key: "clarity", label: "Clarity" },
];

export function overallScore(grade: Grade): number {
  const total = GRADE_AREA_LABELS.reduce((sum, area) => sum + grade[area.key], 0);
  return Math.round((total / GRADE_AREA_LABELS.length) * 10) / 10;
}
