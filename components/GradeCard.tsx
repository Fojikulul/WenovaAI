"use client";

import { animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect } from "react";
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

// The ring around the overall score: it fills to score / 5 and the number
// counts up from 0. Decoration around the number; screen readers get the
// plain text instead.
function ScoreRing({ score }: { score: number }) {
  const count = useMotionValue(0);
  const shown = useTransform(count, (value) => value.toFixed(1));

  useEffect(() => {
    const controls = animate(count, score, { duration: 1, ease: "easeOut" });
    return () => controls.stop();
  }, [count, score]);

  return (
    <div className="relative size-20 shrink-0">
      <svg viewBox="0 0 80 80" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r="34" fill="none" strokeWidth="8" className="stroke-divider" />
        <motion.circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-secondary"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: score / 5 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <motion.span
        aria-hidden="true"
        className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-heading"
      >
        {shown}
      </motion.span>
    </div>
  );
}

// Essay grade, shown at the top of the feedback so it's the first thing a
// student sees: the overall score in a ring, then the four areas (1-5) with
// small bars. Only shown when the essay has a grade (not null), and always
// called a practice estimate.
export default function GradeCard({ grade }: { grade: Grade }) {
  const overall = overallScore(grade);

  return (
    <section aria-labelledby="grade-title" className="flex items-center gap-4 rounded-xl bg-surface p-3">
      <ScoreRing score={overall} />
      <div className="min-w-0 flex-1">
        <h3 id="grade-title" className="text-base leading-snug font-semibold md:text-lg">
          Practice estimate <span className="font-normal text-muted">· not an official grade</span>
        </h3>
        <p className="sr-only">{overall.toFixed(1)} out of 5 overall.</p>
        {/* One column: two columns cut off "Organization" in the narrow
            feedback side. */}
        <ul className="mt-1 grid grid-cols-1 gap-y-0.5">
          {AREAS.map((area, index) => (
            <li key={area.key} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 text-base">{area.label}</span>
              {/* Five bars, one filled per point, growing in one after
                  another. Decoration: the number says the same thing, so on
                  the narrowest phones (where "Organization" would touch
                  them) they're left out. */}
              <span aria-hidden="true" className="hidden shrink-0 gap-0.5 min-[400px]:flex">
                {[1, 2, 3, 4, 5].map((point) => (
                  <span key={point} className="h-1.5 w-3 overflow-hidden rounded-full bg-divider">
                    {point <= grade[area.key] && (
                      <motion.span
                        className="block h-full origin-left rounded-full bg-heading"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: 0.3 + index * 0.1 + point * 0.05, duration: 0.3 }}
                      />
                    )}
                  </span>
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
