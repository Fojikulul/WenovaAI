import type { ReactNode } from "react";
import type { Mistake } from "@/lib/validate-feedback";
import { CheckIcon } from "./icons";

export type LocatedMistake = Mistake & {
  start: number; // index of the first character in the text
  end: number; // index just after the last character
  number: number; // 1, 2, 3... in the order the mistakes appear in the text
  rank: number; // 0 = most important, the order the server sent them in
};

export function locateMistakes(text: string, mistakes: Mistake[]): LocatedMistake[] {
  const found: Omit<LocatedMistake, "number">[] = [];
  mistakes.forEach((mistake, rank) => {
    const start = text.indexOf(mistake.original);
    if (mistake.original === "" || start === -1) return;
    const end = start + mistake.original.length;
    if (found.some((other) => start < other.end && other.start < end)) return;
    found.push({ ...mistake, start, end, rank });
  });
  return found
    .sort((a, b) => a.start - b.start)
    .map((mistake, index) => ({ ...mistake, number: index + 1 }));
}

export function withFixes(text: string, mistakes: LocatedMistake[], applied: ReadonlySet<number>) {
  let result = "";
  let position = 0;
  mistakes.forEach((mistake, index) => {
    if (!applied.has(index)) return;
    result += text.slice(position, mistake.start) + mistake.fix;
    position = mistake.end;
  });
  return result + text.slice(position);
}

function paragraphRanges(text: string, mistakes: LocatedMistake[]) {
  const ranges: { start: number; end: number }[] = [];
  let start = 0;
  for (const lineBreak of text.matchAll(/\n+/g)) {
    const breakStart = lineBreak.index;
    const breakEnd = breakStart + lineBreak[0].length;
    if (mistakes.some((m) => breakStart < m.end && m.start < breakEnd)) continue;
    ranges.push({ start, end: breakStart });
    start = breakEnd;
  }
  ranges.push({ start, end: text.length });
  return ranges.filter((range) => text.slice(range.start, range.end).trim() !== "");
}

export default function HighlightedText({
  text,
  mistakes,
  applied,
  selected,
  onSelect,
  ruleTitle,
  panel,
}: {
  text: string;
  mistakes: LocatedMistake[];
  applied: ReadonlySet<number>; // indexes in `mistakes` that the student fixed
  selected: number | null; // index in `mistakes`, or null when none is open
  onSelect: (index: number) => void;
  ruleTitle: (rule: string) => string;
  panel?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 text-lg leading-[1.7]">
      {paragraphRanges(text, mistakes).map((range) => {
        const parts: ReactNode[] = [];
        let position = range.start;
        let hasSelected = false;

        mistakes.forEach((mistake, index) => {
          if (mistake.start < range.start || mistake.start >= range.end) return;
          if (mistake.start > position) parts.push(text.slice(position, mistake.start));

          const isSelected = index === selected;
          const isFixed = applied.has(index);
          if (isSelected) hasSelected = true;

          const look = isFixed
            ? "bg-correct-bg decoration-correct-border decoration-solid"
            : "bg-mistake-bg decoration-mistake-line decoration-wavy";
          const ring = isSelected
            ? isFixed
              ? "ring-2 ring-correct-border"
              : "ring-2 ring-mistake-line animate-pulse-ring"
            : "";

          parts.push(
            <button
              key={mistake.start}
              id={`mistake-${mistake.number}`}
              type="button"
              onClick={() => onSelect(index)}
              aria-expanded={isSelected}
              aria-controls={isSelected ? "fix-panel" : undefined}
              className={`cursor-pointer rounded px-0.5 text-left underline decoration-2 underline-offset-4 [box-decoration-break:clone] transition-colors ${look} ${ring}`}
            >
              <span className="sr-only">
                Mistake {mistake.number} of {mistakes.length}, {isFixed ? "fixed, " : ""}
                {ruleTitle(mistake.rule)}:{" "}
              </span>
              {isFixed ? mistake.fix : mistake.original}
              {isFixed && (
                <span className="ml-1 inline-block align-[-0.2em] text-correct-text">
                  <CheckIcon />
                </span>
              )}
            </button>,
          );
          position = mistake.end;
        });
        if (position < range.end) parts.push(text.slice(position, range.end));

        return (
          <div key={range.start}>
            <p className="whitespace-pre-wrap">{parts}</p>
            {hasSelected && panel}
          </div>
        );
      })}
    </div>
  );
}
