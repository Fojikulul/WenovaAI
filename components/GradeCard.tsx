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
    // Narrower bars on phones, so the area name and "3 / 5" fit on one line.
    <span aria-hidden="true" className="flex shrink-0 gap-1">
      {/* Each filled bar grows in from the left, one after another. */}
      {[1, 2, 3, 4, 5].map((point) => (
        <span key={point} className="h-2 w-4 overflow-hidden rounded-full bg-divider sm:w-6">
          {point <= score && (
            <span
              style={{ animationDelay: `${point * 80}ms` }}
              className="block h-full origin-left animate-grow rounded-full bg-heading"
            />
          )}
        </span>
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
          <li key={area.key} className="flex items-center gap-2 sm:gap-3">
            <span className="min-w-0 flex-1">{area.label}</span>
            <ScoreBars score={grade[area.key]} />
            <span aria-hidden="true" className="w-12 shrink-0 text-right font-bold whitespace-nowrap">
              {grade[area.key]} / 5
            </span>
            <span className="sr-only">{grade[area.key]} out of 5</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
