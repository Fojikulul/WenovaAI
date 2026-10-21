"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { DifficultyBadge, MasteryBadge } from "@/components/LessonBadges";
import { lessonDifficulty } from "@/lib/learning";
import { MASTERY_NEXT_STEP, type LessonMastery } from "@/lib/mastery";

export type MasteryRow = { id: string; title: string } & LessonMastery;

// Every lesson with its mastery level, best quiz score and what it takes to
// reach the next level. The cards spring in one after another as they
// scroll into view.
export default function MasteryGrid({ rows }: { rows: MasteryRow[] }) {
  return (
    <motion.ul
      className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {rows.map((row) => (
        <motion.li
          key={row.id}
          variants={{
            hidden: { opacity: 0, y: 16, scale: 0.97 },
            show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 26 } },
          }}
        >
          {/* CSS hover, not Motion's whileHover, so the lift can't stay stuck
              after opening a lesson and coming back. */}
          <div className="h-full">
            <Link
              href={`/lessons/${row.id}#practice-title`}
              className="flex h-full flex-col gap-2 rounded-xl border border-divider bg-background p-4 transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-[3px] hover:border-primary hover:shadow-md active:scale-[0.98]"
            >
              <span className="flex flex-wrap items-center gap-1.5">
                <MasteryBadge level={row.level} />
                <DifficultyBadge difficulty={lessonDifficulty(row.id)} />
              </span>
              <span className="font-heading text-lg font-semibold text-heading">{row.title}</span>
              <span className="text-sm text-muted">
                {row.best === null
                  ? "No quiz yet"
                  : `Best quiz ${Math.round(row.best * 100)}% · ${row.attempts} ${row.attempts === 1 ? "try" : "tries"}`}
              </span>
              <span className="mt-auto text-sm">{MASTERY_NEXT_STEP[row.level]}</span>
            </Link>
          </div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
