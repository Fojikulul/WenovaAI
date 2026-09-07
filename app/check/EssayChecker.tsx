"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import GradeCard from "@/components/GradeCard";
import HighlightedText, { locateMistakes, withFixes } from "@/components/HighlightedText";
import { AlertIcon, CheckIcon, HourglassIcon, PencilIcon } from "@/components/icons";
import MistakeFix, { type LessonInfo } from "@/components/MistakeFix";
import { MAX_TEXT_LENGTH_BY_MODE } from "@/lib/limits";
import type { Feedback } from "@/lib/validate-feedback";
import { EXAMPLE_ESSAY } from "./example-essay";

const MAX_LENGTH = MAX_TEXT_LENGTH_BY_MODE.essay;
const NEAR_LIMIT = Math.floor(MAX_LENGTH * 0.9);

const TRY_AGAIN = "We couldn't check your writing right now. Please try again.";
const WRITE_FIRST = "Please write something first.";

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-primary";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-[22px] py-[10px] font-bold text-primary transition-colors hover:bg-surface";

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

type Status = "editing" | "checking" | "results";

export default function EssayChecker({ lessons }: { lessons: Record<string, LessonInfo> }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("editing");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [checkedText, setCheckedText] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [applied, setApplied] = useState<ReadonlySet<number>>(new Set());

  const mistakes = useMemo(
    () => (feedback ? locateMistakes(checkedText, feedback.mistakes) : []),
    [feedback, checkedText],
  );

  const ruleTitle = (rule: string) => lessons[rule]?.title ?? "Other";

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const focusAfterUpdate = useRef<string | null>(null);

  const checking = status === "checking";
  const length = text.length;
  const tooLong = length > MAX_LENGTH;
  const nearLimit = length >= NEAR_LIMIT;
  const canCheck = text.trim() !== "" && !tooLong && !checking;

  useEffect(() => {
    if (status === "results") resultsHeadingRef.current?.focus();
  }, [status]);

  useEffect(() => {
    if (focusAfterUpdate.current === null) return;
    document.getElementById(focusAfterUpdate.current)?.focus();
    focusAfterUpdate.current = null;
  });

  async function check(event?: FormEvent) {
    event?.preventDefault();
    if (checking) return;
    if (text.trim() === "") {
      setError(WRITE_FIRST);
      return;
    }
    if (tooLong) return;

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
      setError(TRY_AGAIN);
      setStatus("editing");
    }
  }

  function changeText(value: string) {
    setText(value);
    setError(null);
  }

  function tryExample() {
    changeText(EXAMPLE_ESSAY);
    textareaRef.current?.focus();
  }

  function setFixApplied(index: number, isApplied: boolean) {
    const next = new Set(applied);
    if (isApplied) next.add(index);
    else next.delete(index);
    setApplied(next);
    setText(withFixes(checkedText, mistakes, next));
  }

  function closePanel() {
    if (selected === null) return;
    focusAfterUpdate.current = `mistake-${mistakes[selected].number}`;
    setSelected(null);
  }

  function selectInText(index: number) {
    setSelected(selected === index ? null : index);
  }

  function editAgain() {
    setStatus("editing");
    setFeedback(null);
    setSelected(null);
    setApplied(new Set());
    focusAfterUpdate.current = "essay";
  }

  if (status === "results" && feedback) {
    return (
      <section aria-labelledby="results-title" className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="results-title" ref={resultsHeadingRef} tabIndex={-1} className="text-2xl font-semibold">
            Your feedback
          </h2>
          <button type="button" onClick={editAgain} className={secondaryButton}>
            <PencilIcon />
            Edit my writing
          </button>
        </div>

        {feedback.grade && <GradeCard grade={feedback.grade} />}
        <p className="text-lg">{feedback.summary}</p>

        {mistakes.length === 0 ? (
          feedback.grade && (
            <p className="flex items-center gap-2 rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3 font-bold text-correct-text">
              <CheckIcon />
              Nothing to fix. Great work!
            </p>
          )
        ) : (
          <p className="font-bold">
            {plural(mistakes.length, "thing")} to fix
            {applied.size > 0 ? ` · ${applied.size} fixed` : ""}. Tap a highlight to fix it.
          </p>
        )}

        <div className="rounded-2xl border border-divider bg-background p-5 shadow-sm md:p-6">
          <HighlightedText
            text={checkedText}
            mistakes={mistakes}
            applied={applied}
            selected={selected}
            onSelect={selectInText}
            ruleTitle={ruleTitle}
            panel={
              selected !== null && (
                <div className="mt-3">
                  <MistakeFix
                    key={mistakes[selected].start}
                    mistake={mistakes[selected]}
                    total={mistakes.length}
                    lesson={lessons[mistakes[selected].rule]}
                    applied={applied.has(selected)}
                    onApply={() => setFixApplied(selected, true)}
                    onUndo={() => setFixApplied(selected, false)}
                    onClose={closePanel}
                    onPrevious={selected > 0 ? () => setSelected(selected - 1) : undefined}
                    onNext={selected < mistakes.length - 1 ? () => setSelected(selected + 1) : undefined}
                  />
                </div>
              )
            }
          />
        </div>
      </section>
    );
  }

  return (
    <form onSubmit={check} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <label htmlFor="essay" className="text-xl font-semibold text-heading">
          Your writing
        </label>
        <button
          type="button"
          onClick={tryExample}
          className="inline-flex min-h-11 items-center font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
        >
          Try an example
        </button>
      </div>
      <textarea
        id="essay"
        ref={textareaRef}
        value={text}
        onChange={(event) => changeText(event.target.value)}
        // No spellcheck or Grammarly here, so they don't show the mistakes before Wenova does.
        spellCheck={false}
        data-gramm="false"
        // Locked while checking, so the highlights match the text that was sent.
        readOnly={checking}
        rows={12}
        aria-describedby="essay-counter essay-too-long"
        className={`block min-h-[300px] w-full resize-y rounded-lg border border-border px-4 py-3 text-lg leading-[1.7] text-text ${
          checking ? "bg-surface" : "bg-background"
        }`}
      />
      <p id="essay-counter" className={nearLimit ? "font-bold text-hint-text" : "text-muted"}>
        {plural(countWords(text), "word")} · {length.toLocaleString("en-US")} /{" "}
        {MAX_LENGTH.toLocaleString("en-US")} characters
        {nearLimit && !tooLong && " · Almost at the limit"}
      </p>
      <p id="essay-too-long" aria-live="polite" className="font-bold text-hint-text empty:hidden">
        {tooLong && `That's ${plural(length - MAX_LENGTH, "character")} too many. Please make it shorter.`}
      </p>

      {error && (
        <div role="alert" className="flex gap-3 rounded-lg border-2 border-hint-border bg-hint-bg px-4 py-3 text-hint-text">
          <span className="mt-1">
            <AlertIcon />
          </span>
          <p className="font-bold">{error}</p>
        </div>
      )}

      <p role="status" className="sr-only">
        {checking ? "Checking your writing…" : ""}
      </p>
      <button type="submit" aria-disabled={!canCheck} className={`self-start ${primaryButton}`}>
        {checking ? (
          <>
            <HourglassIcon />
            Checking your writing…
          </>
        ) : (
          "Check my writing"
        )}
      </button>
    </form>
  );
}
