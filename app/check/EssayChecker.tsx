"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import GradeCard from "@/components/GradeCard";
import HighlightedText, { locateMistakes, withFixes } from "@/components/HighlightedText";
import {
  AlertIcon,
  CheckIcon,
  FileTextIcon,
  HourglassIcon,
  PencilIcon,
  UndoIcon,
  XIcon,
} from "@/components/icons";
import MistakeFix, { type LessonInfo } from "@/components/MistakeFix";
import RuleTag from "@/components/RuleTag";
import { MAX_TEXT_LENGTH_BY_MODE } from "@/lib/limits";
import type { Feedback } from "@/lib/validate-feedback";
import { EXAMPLE_ESSAY } from "./example-essay";

const MAX_LENGTH = MAX_TEXT_LENGTH_BY_MODE.essay;
// The counter turns amber from this many characters (90% of the limit).
const NEAR_LIMIT = Math.floor(MAX_LENGTH * 0.9);

const TRY_AGAIN = "We couldn't check your writing right now. Please try again.";
const WRITE_FIRST = "Please write something first.";

// The draft is kept in sessionStorage: only in this browser tab, on the
// student's own device, and deleted by the browser when the tab closes. It
// never goes to our server. Only the text is kept, never the feedback.
const DRAFT_KEY = "wenova-essay-draft";

function saveDraft(text: string) {
  // Storage can be turned off or full (for example in private windows), so
  // any error is ignored and the page works without saving.
  try {
    if (text === "") sessionStorage.removeItem(DRAFT_KEY);
    else sessionStorage.setItem(DRAFT_KEY, text);
  } catch {}
}

function loadDraft(): string {
  try {
    return sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

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
// the results. Student writing is never logged or saved on a server; the
// current draft is kept in this browser tab only (see DRAFT_KEY).
export default function EssayChecker({ lessons }: { lessons: Record<string, LessonInfo> }) {
  // The text box. It also gets the applied fixes, so "Edit my writing" and
  // the saved draft include them.
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
  // The mistakes the student applied a fix to (indexes in `mistakes`).
  const [applied, setApplied] = useState<ReadonlySet<number>>(new Set());

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

  const ruleTitle = (rule: string) => lessons[rule]?.title ?? "Other";

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  // The id of an element to move keyboard focus to once the page has updated
  // (for example a highlight, after its panel closes).
  const focusAfterUpdate = useRef<string | null>(null);

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

  // Runs after every update: if a focus move is waiting, do it now that the
  // element is on the page.
  useEffect(() => {
    if (focusAfterUpdate.current === null) return;
    document.getElementById(focusAfterUpdate.current)?.focus();
    focusAfterUpdate.current = null;
  });

  // Coming back to the page: put the saved draft back in the box. This runs
  // once, after the first render, because the server can't see sessionStorage
  // (reading it during the first render would make the server's page and the
  // browser's page different).
  useEffect(() => {
    const draft = loadDraft();
    // Reading browser storage once is what effects are for, so the lint rule
    // against setting state in an effect is turned off for this line only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft !== "") setText(draft);
  }, []);

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
      setApplied(new Set());
      setStatus("results");
    } catch {
      // No internet, or the server didn't answer.
      setError(TRY_AGAIN);
      setStatus("editing");
    }
  }

  // Every change to the text goes through here, so the saved draft always
  // matches the box.
  function updateText(value: string) {
    setText(value);
    saveDraft(value);
  }

  function changeText(value: string) {
    updateText(value);
    setClearedText(null);
    setError(null); // An old error no longer fits the new text.
  }

  function tryExample() {
    changeText(EXAMPLE_ESSAY);
    textareaRef.current?.focus();
  }

  // Clearing also deletes the saved draft. "Undo clear" saves it again.
  function clear() {
    setClearedText(text);
    updateText("");
    setError(null);
    textareaRef.current?.focus();
  }

  function undoClear() {
    if (clearedText === null) return;
    updateText(clearedText);
    setClearedText(null);
    textareaRef.current?.focus();
  }

  // Apply or undo one fix. The highlights always come from the checked text,
  // and the text box gets that text with the applied fixes put in.
  function setFixApplied(index: number, isApplied: boolean) {
    const next = new Set(applied);
    if (isApplied) next.add(index);
    else next.delete(index);
    setApplied(next);
    updateText(withFixes(checkedText, mistakes, next));
  }

  // Closing the panel puts keyboard focus back on the highlight it came from.
  function closePanel() {
    if (selected === null) return;
    focusAfterUpdate.current = `mistake-${mistakes[selected].number}`;
    setSelected(null);
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

  // Back to the text box, with any applied fixes already in the text.
  function editAgain() {
    setStatus("editing");
    setFeedback(null);
    setSelected(null);
    setApplied(new Set());
    focusAfterUpdate.current = "essay"; // the text box, once it's back
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
          applied={applied}
          selected={selected}
          onSelect={selectInText}
          ruleTitle={ruleTitle}
          panel={
            selected !== null && (
              // The key starts the panel fresh for each mistake.
              <MistakeFix
                key={mistakes[selected].start}
                mistake={mistakes[selected]}
                total={mistakes.length}
                lesson={lessons[mistakes[selected].rule]}
                applied={applied.has(selected)}
                onApply={() => setFixApplied(selected, true)}
                onUndo={() => setFixApplied(selected, false)}
                onClose={closePanel}
              />
            )
          }
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
    // On desktop the grid stretches both cards to the same height while
    // editing. With results, each card is only as tall as its content
    // (items-start), so a short essay doesn't leave a big empty card.
    <div
      className={`mt-6 grid gap-6 md:mt-8 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-12 ${
        status === "results" ? "lg:items-start" : ""
      }`}
    >
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
                {applied.size > 0 && ` · ${applied.size} fixed`}
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
                          <span className="flex items-center gap-2 font-bold text-muted">
                            Mistake {mistake.number}
                            {applied.has(index) && (
                              <span className="flex items-center gap-1 text-correct-text">
                                <CheckIcon />
                                Fixed
                              </span>
                            )}
                          </span>
                          <RuleTag title={lessons[mistake.rule]?.title} />
                        </span>
                        <span className="text-lg">
                          {applied.has(index) ? (
                            <span className="rounded bg-correct-bg px-0.5 underline decoration-correct-border decoration-2 underline-offset-4 [box-decoration-break:clone]">
                              {mistake.fix}
                            </span>
                          ) : (
                            <span className="rounded bg-mistake-bg px-0.5 underline decoration-mistake-line decoration-wavy decoration-2 underline-offset-4 [box-decoration-break:clone]">
                              {mistake.original}
                            </span>
                          )}
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
