import type { Grade } from "@/lib/validate-feedback";

// The four grade areas in the order they are shown. Typed with the keys of
// Grade, so the build fails if an area is renamed in the contract.
const AREAS: { key: keyof Grade; label: string }[] = [
  { key: "grammar", label: "Grammar" },
  { key: "vocabulary", label: "Vocabulary" },
  { key: "organization", label: "Organization" },
  { key: "clarity", label: "Clarity" },
];

// The overall score is the average of the four areas, worked out here in
// code (CLAUDE.md: not by the AI), rounded to one decimal, e.g. 3.25 -> 3.3.
export function overallScore(grade: Grade): number {
  const total = AREAS.reduce((sum, area) => sum + grade[area.key], 0);
  return Math.round((total / AREAS.length) * 10) / 10;
}

// Five small bars, one filled per point. Decoration only: the number next to
// it says the same thing, so screen readers skip it.
function ScoreBars({ score }: { score: number }) {
  return (
    <span aria-hidden="true" className="flex gap-1">
      {[1, 2, 3, 4, 5].map((point) => (
        <span
          key={point}
          className={`h-2 w-6 rounded-full ${point <= score ? "bg-heading" : "bg-divider"}`}
        />
      ))}
    </span>
  );
}

// Essay grade: the overall score and the four areas, each 1-5. Only shown when
// the essay has a grade (not null), and always called a practice estimate.
export default function GradeCard({ grade }: { grade: Grade }) {
  const overall = overallScore(grade).toFixed(1);

  return (
    <section aria-labelledby="grade-title" className="rounded-lg bg-surface p-4">
      <h3 id="grade-title" className="text-lg font-semibold md:text-xl">
        Practice estimate
      </h3>
      <p className="mt-1 text-muted">Not an official grade.</p>

      <p className="mt-4 flex items-baseline gap-2">
        <span className="font-heading text-4xl font-bold text-heading">{overall}</span>
        <span aria-hidden="true" className="text-muted">
          / 5 overall
        </span>
        <span className="sr-only">out of 5 overall</span>
      </p>

      <ul className="mt-4 flex flex-col gap-3">
        {AREAS.map((area) => (
          <li key={area.key} className="flex items-center gap-3">
            <span className="flex-1">{area.label}</span>
            <ScoreBars score={grade[area.key]} />
            <span aria-hidden="true" className="w-12 text-right font-bold">
              {grade[area.key]} / 5
            </span>
            <span className="sr-only">{grade[area.key]} out of 5</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
