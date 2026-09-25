"use client";

import { DIFFICULTY_LABELS, type Difficulty } from "@/lib/learning";

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
