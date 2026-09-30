"use client";

import { motion } from "motion/react";
import { DIFFICULTY_LABELS, type Difficulty } from "@/lib/learning";
import { MASTERY_LABELS, MASTERY_STEPS, type MasteryLevel } from "@/lib/mastery";

const BARS: Record<Difficulty, number> = { beginner: 1, intermediate: 2, advanced: 3 };

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tag-bg px-2.5 py-0.5 text-sm font-bold whitespace-nowrap text-tag-text">
      <span aria-hidden="true" className="flex h-3 items-end gap-0.5">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-1 rounded-sm ${bar <= BARS[difficulty] ? "bg-current" : "bg-current opacity-25"}`}
            style={{ height: `${bar * 4}px` }}
          />
        ))}
      </span>
      {DIFFICULTY_LABELS[difficulty]}
    </span>
  );
}

const MASTERY_STYLE: Record<MasteryLevel, string> = {
  "not-started": "border border-divider bg-surface text-muted",
  learning: "bg-hint-bg text-hint-text",
  practicing: "bg-primary/10 text-primary",
  passed: "bg-correct-bg text-correct-text",
  mastered: "bg-linear-to-r from-primary to-secondary text-on-primary",
};

export function MasteryBadge({ level, delay = 0 }: { level: MasteryLevel; delay?: number }) {
  const steps = MASTERY_STEPS[level];
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22, delay }}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold whitespace-nowrap ${MASTERY_STYLE[level]}`}
    >
      {level === "mastered" ? (
        // Icon paths from Lucide (lucide.dev), ISC license.
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-3.5" fill="currentColor">
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </svg>
      ) : (
        <span aria-hidden="true" className="flex gap-0.5">
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={`h-1.5 w-2 rounded-full bg-current ${step <= steps ? "" : "opacity-25"}`} />
          ))}
        </span>
      )}
      {MASTERY_LABELS[level]}
    </motion.span>
  );
}
