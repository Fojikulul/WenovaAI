"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import GradeCard from "@/components/GradeCard";
import HighlightedText, { locateMistakes } from "@/components/HighlightedText";
import {
  AlertIcon,
  CheckIcon,
  FileTextIcon,
  HourglassIcon,
  PencilIcon,
  UndoIcon,
  XIcon,
} from "@/components/icons";
import RuleTag from "@/components/RuleTag";
import { MAX_TEXT_LENGTH_BY_MODE } from "@/lib/limits";
import type { Feedback } from "@/lib/validate-feedback";
import { EXAMPLE_ESSAY } from "./example-essay";

const MAX_LENGTH = MAX_TEXT_LENGTH_BY_MODE.essay;
// The counter turns amber from this many characters (90% of the limit).
const NEAR_LIMIT = Math.floor(MAX_LENGTH * 0.9);

const TRY_AGAIN = "We couldn't check your writing right now. Please try again.";
const WRITE_FIRST = "Please write something first.";

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-primary";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-[22px] py-[10px] font-bold text-primary transition-colors hover:bg-surface";
// The secondary button for the small toolbar in a card header: exactly 48px
// tall and less side padding, so both card headers are the same height.
const toolbarButton =
  "inline-flex h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-4 font-bold text-primary transition-colors hover:bg-surface";
const cardTitle = "text-lg leading-snug font-semibold md:text-xl";

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

// A card from MASTER.md: white, 1px divider border, rounded corners. The header
// row holds the title on the left and a small toolbar on the right; on narrow
// screens the toolbar moves under the title and stays on the right.
function Card({
  titleId,
  title,
  toolbar,
  className = "",
  children,
}: {
  titleId: string;
  title: ReactNode;
  toolbar?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={titleId}
      className={`flex min-w-0 flex-col rounded-xl border border-divider bg-background ${className}`}
    >
      {/* 72px tall: a 48px button plus 12px above and below. The dividing
          line belongs to the body, so it never changes the header height. */}
      <div className="flex min-h-[4.5rem] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 md:px-6">
        {title}
        {toolbar && (
          <div className="ml-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
            {toolbar}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col border-t border-divider p-4 md:p-6">{children}</div>
    </section>
  );
}

// Centered message for the feedback card before there is any feedback.
function CenteredState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface text-muted">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold md:text-xl">{title}</h3>
      {children}
    </div>
  );
}

type Status = "editing" | "checking" | "results";

// The whole Essay Checker: the text box, the "Check my writing" request, and
// the results. Student writing stays in this component's state only; it is
// never saved or logged.
export default function EssayChecker({ lessonTitles }: { lessonTitles: Record<string, string> }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("editing");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // The exact text that was checked. The highlights are found in this text.
  const [checkedText, setCheckedText] = useState("");
  // The text from just before "Clear", so "Undo clear" can bring it back.
  // Forgotten as soon as the student types or picks the example.
  const [clearedText, setClearedText] = useState<string | null>(null);
  // The open mistake: an index in `mistakes` (text order), or null.
  const [selected, setSelected] = useState<number | null>(null);

  // The mistakes with their place in the text, in the order they appear.
  const mistakes = useMemo(
    () => (feedback ? locateMistakes(checkedText, feedback.mistakes) : []),
    [feedback, checkedText],
  );
  // The same mistakes, most important first (the order the server sent), for
  // the list in the feedback card. `index` still points into `mistakes`.
  const mistakesByImportance = mistakes
    .map((mistake, index) => ({ mistake, index }))
    .sort((a, b) => a.mistake.rank - b.mistake.rank);

  const ruleTitle = (rule: string) => lessonTitles[rule] ?? "Other";

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);

  const checking = status === "checking";
  const length = text.length;
  const tooLong = length > MAX_LENGTH;
  const nearLimit = length >= NEAR_LIMIT;
  const canCheck = text.trim() !== "" && !tooLong && !checking;

  // When results arrive, move focus to them. On phones they are under the
  // text box, so this also scrolls them into view.
  useEffect(() => {
    if (status === "results") resultsHeadingRef.current?.focus();
  }, [status]);

  async function check(event: FormEvent) {
    event.preventDefault();
    if (checking) return;
    // The button only looks disabled (aria-disabled), so say why in words.
    if (text.trim() === "") {
      setError(WRITE_FIRST);
      return;
    }
    if (tooLong) return; // The counter already says how much to cut.

    const sent = text;
    setStatus("checking");
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "essay", text: sent }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !Array.isArray(data.mistakes) || typeof data.summary !== "string") {
        // The route sends a friendly { error } message; use it when there is one.
        setError(typeof data?.error === "string" ? data.error : TRY_AGAIN);
        setStatus("editing");
        return;
      }

      setFeedback(data as Feedback);
      setCheckedText(sent);
      setSelected(null);
      setStatus("results");
    } catch {
      // No internet, or the server didn't answer.
      setError(TRY_AGAIN);
      setStatus("editing");
    }
  }

  function changeText(value: string) {
    setText(value);
    setClearedText(null);
    setError(null); // An old error no longer fits the new text.
  }

  function tryExample() {
    changeText(EXAMPLE_ESSAY);
    textareaRef.current?.focus();
  }

  function clear() {
    setClearedText(text);
    setText("");
    setError(null);
    textareaRef.current?.focus();
  }

  function undoClear() {
    if (clearedText === null) return;
    setText(clearedText);
    setClearedText(null);
    textareaRef.current?.focus();
  }

  // Tapping a highlight opens that mistake; tapping it again closes it.
  function selectInText(index: number) {
    setSelected(selected === index ? null : index);
  }

  // Picking a mistake from the list opens it and scrolls its highlight to the
  // middle of the screen, so the sentence around it shows too. The scroll is
  // instant (no animation).
  function selectFromList(index: number) {
    setSelected(index);
    document
      .getElementById(`mistake-${mistakes[index].number}`)
      ?.scrollIntoView({ block: "center" });
  }

  function editAgain() {
    setStatus("editing");
    setFeedback(null);
    setSelected(null);
    // Wait for the text box to be back on the page before focusing it.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  let writingCard: ReactNode;
  if (status === "results") {
    writingCard = (
      <Card
        titleId="writing-title"
        title={
          <h2 id="writing-title" className={cardTitle}>
            Your writing
          </h2>
        }
        toolbar={
          <button type="button" onClick={editAgain} className={toolbarButton}>
            <PencilIcon />
            Edit my writing
          </button>
        }
      >
        <HighlightedText
          text={checkedText}
          mistakes={mistakes}
          selected={selected}
          onSelect={selectInText}
          ruleTitle={ruleTitle}
        />
      </Card>
    );
  } else {
    writingCard = (
      <Card
        titleId="writing-title"
        title={
          <h2 id="writing-title" className={cardTitle}>
            <label htmlFor="essay">Your writing</label>
          </h2>
        }
        toolbar={
          <>
            <p
              id="essay-counter"
              className={`text-right ${nearLimit ? "font-bold text-hint-text" : "text-muted"}`}
            >
              {plural(countWords(text), "word")} · {length.toLocaleString("en-US")} /{" "}
              {MAX_LENGTH.toLocaleString("en-US")} characters
              {nearLimit && !tooLong && " · Almost at the limit"}
            </p>
            {/* "Clear" while there is text; "Undo clear" right after clearing,
                until the student types something. */}
            {!checking && text !== "" && (
              <button type="button" onClick={clear} className={toolbarButton}>
                <XIcon />
                Clear
              </button>
            )}
            {!checking && text === "" && clearedText !== null && (
              <button type="button" onClick={undoClear} className={toolbarButton}>
                <UndoIcon />
                Undo clear
              </button>
            )}
          </>
        }
      >
        <form onSubmit={check} className="flex flex-1 flex-col">
          <textarea
            id="essay"
            ref={textareaRef}
            value={text}
            onChange={(event) => changeText(event.target.value)}
            placeholder="Paste or type your essay here…"
            // Turn off the browser's spellcheck and the Grammarly extension in
            // this box, so they don't show the mistakes before Wenova does.
            spellCheck={false}
            data-gramm="false"
            // Locked while checking, so the highlights match the text that was sent.
            readOnly={checking}
            aria-describedby="essay-counter essay-too-long"
            className="block min-h-[300px] w-full flex-1 resize-y rounded-lg border border-border bg-background px-4 py-3 text-lg leading-[1.7] text-text placeholder:text-muted read-only:bg-surface lg:min-h-[26rem] lg:resize-none"
          />
          {/* A live region, so screen readers hear it when the essay gets too long. */}
          <p id="essay-too-long" aria-live="polite" className="font-bold text-hint-text">
            {tooLong &&
              `That's ${plural(length - MAX_LENGTH, "character")} too many. Please make it shorter.`}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="submit" aria-disabled={!canCheck} className={primaryButton}>
              {checking ? (
                <>
                  <HourglassIcon />
                  Checking your writing…
                </>
              ) : (
                "Check my writing"
              )}
            </button>
            {/* Only while the box is empty, so a tap here never replaces
                writing the student already put in the box. */}
            {text === "" && (
              <button type="button" onClick={tryExample} className={secondaryButton}>
                <FileTextIcon />
                Try an example
              </button>
            )}
          </div>

          {error && (
            <div
              role="alert"
              className="mt-4 flex gap-3 rounded-lg border-2 border-hint-border bg-hint-bg px-4 py-3 text-hint-text"
            >
              <span className="mt-1">
                <AlertIcon />
              </span>
              <p className="font-bold">{error}</p>
            </div>
          )}
        </form>
      </Card>
    );
  }

  return (
    // On desktop the grid stretches both cards to the same height.
    <div className="mt-6 grid gap-6 md:mt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12">
      {writingCard}

      <Card
        titleId="feedback-title"
        // Before the first check there is nothing here, so phones skip it.
        className={status === "editing" ? "hidden lg:flex" : ""}
        title={
          <h2 id="feedback-title" ref={resultsHeadingRef} tabIndex={-1} className={cardTitle}>
            Your feedback
          </h2>
        }
      >
        {/* Always on the page and empty until checking starts, so screen
            readers announce it. The box below shows the same words. */}
        <p role="status" className="sr-only">
          {checking ? "Checking your writing…" : ""}
        </p>

        {status === "editing" && (
          <CenteredState icon={<FileTextIcon size={32} />} title="Ready when you are">
            <p className="mt-2 text-muted">Paste your essay and press Check my writing.</p>
          </CenteredState>
        )}

        {checking && (
          <div aria-hidden="true" className="flex flex-1 flex-col">
            <CenteredState icon={<HourglassIcon size={32} />} title="Checking your writing…" />
          </div>
        )}

        {status === "results" && feedback && (
          <div className="flex flex-col gap-6">
            <p>{feedback.summary}</p>

            {/* No mistakes: a positive state. But a non-English essay also has
                no mistakes; it's the one with grade null, and its summary
                already asks for English, so it gets no "Nothing to fix". */}
            {mistakes.length > 0 ? (
              <p className="text-lg font-bold">
                {plural(mistakes.length, "thing")} to fix
              </p>
            ) : (
              feedback.grade && (
                <p className="flex items-center gap-2 rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3 font-bold text-correct-text">
                  <CheckIcon />
                  Nothing to fix. Great work!
                </p>
              )
            )}

            {feedback.grade && <GradeCard grade={feedback.grade} />}

            {mistakes.length > 0 && (
              <section aria-labelledby="mistakes-title">
                <h3 id="mistakes-title" className="text-lg font-semibold md:text-xl">
                  Your mistakes
                </h3>
                <p className="mt-1 text-muted">Most important first.</p>
                <ul className="mt-4 flex flex-col gap-3">
                  {mistakesByImportance.map(({ mistake, index }) => (
                    <li key={mistake.start}>
                      <button
                        type="button"
                        onClick={() => selectFromList(index)}
                        aria-expanded={selected === index}
                        className={`flex w-full flex-col gap-2 rounded-lg border-2 p-3 text-left transition-colors ${
                          selected === index
                            ? "border-primary bg-surface"
                            : "border-divider hover:border-primary"
                        }`}
                      >
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-bold text-muted">Mistake {mistake.number}</span>
                          <RuleTag title={lessonTitles[mistake.rule]} />
                        </span>
                        <span className="text-lg">
                          <span className="rounded bg-mistake-bg px-0.5 underline decoration-mistake-line decoration-wavy decoration-2 underline-offset-4 [box-decoration-break:clone]">
                            {mistake.original}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
