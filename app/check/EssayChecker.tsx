"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AlertIcon, FileTextIcon, HourglassIcon, PencilIcon, XIcon } from "@/components/icons";
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
const sectionTitle = "text-[1.375rem] leading-snug font-semibold md:text-[1.75rem]";

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

type Status = "editing" | "checking" | "results";

// The whole Essay Checker: the text box, the "Check my writing" request, and
// the results. Student writing stays in this component's state only; it is
// never saved or logged.
export default function EssayChecker() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("editing");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // The exact text that was checked. The highlights are found in this text.
  const [checkedText, setCheckedText] = useState("");

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
      setStatus("results");
    } catch {
      // No internet, or the server didn't answer.
      setError(TRY_AGAIN);
      setStatus("editing");
    }
  }

  function tryExample() {
    setText(EXAMPLE_ESSAY);
    setError(null);
    textareaRef.current?.focus();
  }

  function clear() {
    setText("");
    setError(null);
    textareaRef.current?.focus();
  }

  function editAgain() {
    setStatus("editing");
    setFeedback(null);
    // Wait for the text box to be back on the page before focusing it.
    requestAnimationFrame(() => textareaRef.current?.focus());
  }

  return (
    <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px]">
      {/* Left (or top on phones): the student's writing. */}
      <section aria-labelledby="writing-title" className="min-w-0">
        {status === "results" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="writing-title" className={sectionTitle}>
                Your writing
              </h2>
              <button type="button" onClick={editAgain} className={secondaryButton}>
                <PencilIcon />
                Edit my writing
              </button>
            </div>
            {/* Step 2 replaces this with the highlighted text. */}
            <div className="mt-4 flex flex-col gap-4 rounded-xl border border-divider p-6 text-lg leading-[1.7]">
              {checkedText.split(/\n+/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </>
        ) : (
          <form onSubmit={check}>
            <h2 id="writing-title" className={sectionTitle}>
              <label htmlFor="essay">Your writing</label>
            </h2>
            <textarea
              id="essay"
              ref={textareaRef}
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                setError(null); // An old error no longer fits the new text.
              }}
              // Locked while checking, so the highlights match the text that was sent.
              readOnly={checking}
              aria-describedby="essay-counter essay-too-long"
              className="mt-4 block min-h-[300px] w-full resize-y rounded-lg border border-border bg-background px-4 py-3 text-lg leading-[1.7] text-text read-only:bg-surface"
            />

            <p
              id="essay-counter"
              className={`mt-2 ${nearLimit ? "font-bold text-hint-text" : "text-muted"}`}
            >
              {plural(countWords(text), "word")} · {length.toLocaleString("en-US")} /{" "}
              {MAX_LENGTH.toLocaleString("en-US")} characters
              {nearLimit && !tooLong && " · Almost at the limit"}
            </p>
            {/* A live region, so screen readers hear it when the essay gets too long. */}
            <p id="essay-too-long" aria-live="polite" className="font-bold text-hint-text">
              {tooLong &&
                `That's ${plural(length - MAX_LENGTH, "character")} too many. Please make it shorter.`}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              {/* Only one of these shows at a time, so a tap on "Try an example"
                  never replaces writing the student already put in the box. */}
              {text === "" ? (
                <button type="button" onClick={tryExample} className={secondaryButton}>
                  <FileTextIcon />
                  Try an example
                </button>
              ) : (
                !checking && (
                  <button type="button" onClick={clear} className={secondaryButton}>
                    <XIcon />
                    Clear
                  </button>
                )
              )}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-6 flex gap-3 rounded-lg border-2 border-hint-border bg-hint-bg px-4 py-3 text-hint-text"
              >
                <span className="mt-1">
                  <AlertIcon />
                </span>
                <p className="font-bold">{error}</p>
              </div>
            )}
          </form>
        )}
      </section>

      {/* Right (or bottom on phones): the feedback. */}
      <section aria-labelledby="feedback-title" className="min-w-0">
        <h2
          id="feedback-title"
          ref={resultsHeadingRef}
          tabIndex={-1}
          // Before the first check there is nothing here, so phones skip it.
          className={`${sectionTitle} ${status === "editing" ? "hidden lg:block" : ""}`}
        >
          Your feedback
        </h2>

        {/* Always on the page, so screen readers announce "Checking…" when it appears. */}
        <div role="status">
          {checking && (
            <p className="mt-4 flex items-center gap-3 rounded-xl bg-surface p-6 font-bold">
              <HourglassIcon />
              Checking your writing…
            </p>
          )}
        </div>

        {status === "editing" && (
          <p className="mt-4 hidden rounded-xl bg-surface p-6 text-muted lg:block">
            Your feedback will show here.
          </p>
        )}

        {status === "results" && feedback && (
          // Step 2 adds the count, grade, and list of mistakes.
          <p className="mt-4 rounded-xl border border-divider p-6">{feedback.summary}</p>
        )}
      </section>
    </div>
  );
}
