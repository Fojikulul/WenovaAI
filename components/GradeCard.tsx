import { GRADE_AREA_LABELS as AREAS, overallScore } from "@/lib/grade";
import type { Grade } from "@/lib/validate-feedback";

export default function GradeCard({ grade }: { grade: Grade }) {
  const overall = overallScore(grade);

  return (
    <section aria-labelledby="grade-title" className="flex items-center gap-4 rounded-xl bg-surface p-4">
      <p
        aria-hidden="true"
        className="flex size-20 shrink-0 items-center justify-center rounded-full border-8 border-secondary font-heading text-2xl font-bold text-heading"
      >
        {overall.toFixed(1)}
      </p>
      <div className="min-w-0 flex-1">
        <h3 id="grade-title" className="text-base leading-snug font-semibold md:text-lg">
          Practice estimate <span className="font-normal text-muted">· not an official grade</span>
        </h3>
        <p className="sr-only">{overall.toFixed(1)} out of 5 overall.</p>
        <ul className="mt-1 grid grid-cols-1 gap-y-0.5 sm:grid-cols-2 sm:gap-x-6">
          {AREAS.map((area) => (
            <li key={area.key} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-base">{area.label}</span>
              <span aria-hidden="true" className="flex shrink-0 gap-0.5">
                {[1, 2, 3, 4, 5].map((point) => (
                  <span
                    key={point}
                    className={`h-1.5 w-3 rounded-full ${point <= grade[area.key] ? "bg-heading" : "bg-divider"}`}
                  />
                ))}
              </span>
              <span aria-hidden="true" className="w-9 shrink-0 text-right text-base font-bold whitespace-nowrap">
                {grade[area.key]}/5
              </span>
              <span className="sr-only">{grade[area.key]} out of 5</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
