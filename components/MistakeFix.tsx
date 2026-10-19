"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { checkFix, type FixResult } from "./check-fix";
import type { LocatedMistake } from "./HighlightedText";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  ExternalLinkIcon,
  LightbulbIcon,
  UndoIcon,
  XIcon,
} from "./icons";
import RuleTag from "./RuleTag";

// What the panel needs from data/lessons.json for one lesson.
export type LessonInfo = { title: string; example: string };

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-[22px] py-[10px] font-bold text-primary transition-colors hover:bg-surface aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-background";
const mistakeWords =
  "rounded bg-mistake-bg px-0.5 underline decoration-mistake-line decoration-wavy decoration-2 underline-offset-4 [box-decoration-break:clone]";

// "shown" means the student pressed "Show answer".
type Result = FixResult | "shown" | null;

// The fix panel for one mistake (MASTER.md "Fix Panel"). It opens inline
// under the paragraph with the mistake, never as a popup. The student tries a
// fix, which is checked in code; they can see the answer, apply it to their
// essay (and undo), and open the lesson in a new tab.
export default function MistakeFix({
  mistake,
  total,
  lesson,
  applied,
  onApply,
  onUndo,
  onClose,
  onPrevious,
  onNext,
}: {
  mistake: LocatedMistake;
  total: number;
  lesson?: LessonInfo; // undefined when the rule is "other" or has no lesson
  applied: boolean;
  onApply: () => void;
  onUndo: () => void;
  onClose: () => void;
  onPrevious?: () => void; // undefined on the first mistake
  onNext?: () => void; // undefined on the last mistake
}) {
  // Starts with the student's own words, so they only change what's wrong.
  const [answer, setAnswer] = useState(mistake.original);
  const [result, setResult] = useState<Result>(null);

  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const applyRef = useRef<HTMLButtonElement>(null);
  const undoRef = useRef<HTMLButtonElement>(null);
  // Where keyboard focus goes after Apply or Undo, because the button that
  // was pressed disappears.
  const focusAfterChange = useRef<"apply" | "undo" | null>(null);

  // The fix and the reason are shown once the student has seen the answer.
  const answerShown = result === "correct" || result === "wrong" || result === "shown" || applied;

  // When the panel opens, move focus to its title (so keyboard and screen
  // reader users start here) and make sure the panel is on screen.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    panelRef.current?.scrollIntoView({ block: "nearest" });
  }, []);

  useEffect(() => {
    if (focusAfterChange.current === "undo") undoRef.current?.focus();
    if (focusAfterChange.current === "apply") applyRef.current?.focus();
    focusAfterChange.current = null;
  }, [applied]);

  function check(event: FormEvent) {
    event.preventDefault();
    setResult(checkFix(answer, mistake.original, mistake.fix));
  }

  function apply() {
    focusAfterChange.current = "undo";
    onApply();
  }

  function undo() {
    focusAfterChange.current = "apply";
    onUndo();
  }

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === "Escape") onClose();
  }

  return (
    <div
      ref={panelRef}
      id="fix-panel"
      role="region"
      aria-labelledby="fix-title"
      onKeyDown={closeOnEscape}
      className="mt-4 rounded-xl border border-divider bg-background p-4 text-base leading-[1.6] md:p-6 md:text-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h3
            id="fix-title"
            ref={headingRef}
            tabIndex={-1}
            className="text-lg font-semibold md:text-xl"
          >
            Mistake {mistake.number} of {total}
          </h3>
          <RuleTag title={lesson?.title} />
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="-mt-1 -mr-2 flex size-11 shrink-0 items-center justify-center rounded-lg text-primary transition-colors hover:bg-surface"
        >
          <XIcon />
        </button>
      </div>

      <p className="mt-4 font-bold">Your writing:</p>
      <p className="mt-1 text-lg">
        <span className={mistakeWords}>{mistake.original}</span>
      </p>

      {applied ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 font-bold text-correct-text">
            <CheckIcon />
            Fixed in your essay.
          </p>
          <button ref={undoRef} type="button" onClick={undo} className={secondaryButton}>
            <UndoIcon />
            Undo
          </button>
        </div>
      ) : (
        <form onSubmit={check} className="mt-6">
          <label htmlFor="fix-input" className="font-bold">
            Try to fix it:
          </label>
          <input
            id="fix-input"
            type="text"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            // No browser help here either: the student does the fixing.
            spellCheck={false}
            data-gramm="false"
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            className="mt-2 block min-h-12 w-full rounded-lg border border-border bg-background px-4 py-3 text-lg"
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="submit" className={primaryButton}>
              Check my fix
            </button>
            {!answerShown && (
              <button type="button" onClick={() => setResult("shown")} className={secondaryButton}>
                Show answer
              </button>
            )}
          </div>
        </form>
      )}

      {/* Screen readers read the result out when it appears. */}
      <div aria-live="polite">
        {result === "correct" && (
          <p className="mt-4 flex items-center gap-2 rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3 font-bold text-correct-text">
            <CheckIcon />
            You got it!
          </p>
        )}
        {result === "unchanged" && (
          <p className="mt-4 flex gap-2 rounded-lg border-2 border-hint-border bg-hint-bg px-4 py-3 font-bold text-hint-text">
            <span className="mt-1">
              <LightbulbIcon />
            </span>
            That&apos;s the same as before. What word needs to change?
          </p>
        )}
        {(result === "wrong" || result === "shown") && (
          <div className="mt-4 rounded-lg border-2 border-hint-border bg-hint-bg px-4 py-3">
            <p className="flex items-center gap-2 font-bold text-hint-text">
              <LightbulbIcon />
              {result === "wrong" ? "Good try! Here's one way:" : "Here's one way:"}
            </p>
            <p className="mt-1 text-lg font-bold text-text">{mistake.fix}</p>
          </div>
        )}
      </div>

      {answerShown && (
        <div className="mt-4 flex flex-col gap-4">
          <p>
            <span className="font-bold">Why: </span>
            {mistake.why}
          </p>
          {/* The lesson's general example, not a fix of the student's
              sentence, so the label says it's about the rule. */}
          {lesson && (
            <div>
              <p className="font-bold">Another example of this rule:</p>
              <p className="mt-1 rounded-lg bg-surface px-4 py-3">{lesson.example}</p>
            </div>
          )}
          {!applied && (
            <button ref={applyRef} type="button" onClick={apply} className={`self-start ${secondaryButton}`}>
              Apply this fix
            </button>
          )}
        </div>
      )}

      {lesson && (
        <a
          href={`/lessons/${mistake.rule}#practice-title`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center gap-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
        >
          Practice this rule
          <ExternalLinkIcon />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}

      {/* Move between mistakes in the order of the text. At the first or
          last mistake the button stays (so nothing jumps) but does nothing;
          aria-disabled keeps it focusable. */}
      {total > 1 && (
        <div className="mt-6 flex justify-between gap-3 border-t border-divider pt-4">
          <button
            type="button"
            onClick={onPrevious}
            aria-disabled={!onPrevious}
            className={secondaryButton}
          >
            <ArrowLeftIcon />
            Previous
          </button>
          <button type="button" onClick={onNext} aria-disabled={!onNext} className={secondaryButton}>
            Next
            <ArrowRightIcon />
          </button>
        </div>
      )}
    </div>
  );
}
