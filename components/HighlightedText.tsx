import type { ReactNode } from "react";
import type { Mistake } from "@/lib/validate-feedback";

// A mistake plus where it is in the student's text.
export type LocatedMistake = Mistake & {
  start: number; // index of the first character in the text
  end: number; // index just after the last character
  number: number; // 1, 2, 3... in the order the mistakes appear in the text
  rank: number; // 0 = most important, the order the server sent them in
};

// Finds each mistake's "original" in the text and sorts them in text order.
// The server already keeps only mistakes found exactly once that don't
// overlap; this is a second check, so a slip shows one fewer highlight
// instead of a broken one.
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

// Splits the text into paragraphs at line breaks. A line break inside a
// mistake doesn't split, so every mistake stays in one paragraph.
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
  // Lines with only spaces would be empty paragraphs, so they are left out.
  return ranges.filter((range) => text.slice(range.start, range.end).trim() !== "");
}

// The student's essay with each mistake highlighted in their own words
// (MASTER.md "Mistake Highlight"). Each highlight is a button. `panel` (the
// fix panel) is shown under the paragraph with the selected mistake.
export default function HighlightedText({
  text,
  mistakes,
  selected,
  onSelect,
  ruleTitle,
  panel,
}: {
  text: string;
  mistakes: LocatedMistake[];
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
          if (isSelected) hasSelected = true;
          parts.push(
            <button
              key={mistake.start}
              id={`mistake-${mistake.number}`}
              type="button"
              onClick={() => onSelect(index)}
              aria-expanded={isSelected}
              className={`cursor-pointer rounded px-0.5 text-left underline decoration-mistake-line decoration-wavy decoration-2 underline-offset-4 [box-decoration-break:clone] transition-colors ${
                isSelected ? "bg-mistake-bg ring-2 ring-mistake-line" : "bg-mistake-bg"
              }`}
            >
              <span className="sr-only">
                Mistake {mistake.number} of {mistakes.length}, {ruleTitle(mistake.rule)}:{" "}
              </span>
              {mistake.original}
            </button>,
          );
          position = mistake.end;
        });
        if (position < range.end) parts.push(text.slice(position, range.end));

        return (
          <div key={range.start}>
            {/* pre-wrap keeps the student's spaces exactly as they typed them. */}
            <p className="whitespace-pre-wrap">{parts}</p>
            {hasSelected && panel}
          </div>
        );
      })}
    </div>
  );
}
