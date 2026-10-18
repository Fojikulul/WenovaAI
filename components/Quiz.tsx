"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { PracticeQuestion } from "@/app/lessons/lesson";

// Icons: path data from Lucide (lucide.dev), ISC license. They are decorative,
// so screen readers skip them; the word next to each one says the same thing.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      {children}
    </svg>
  );
}

function CheckIcon() {
  return (
    <Icon>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

function XIcon() {
  return (
    <Icon>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </Icon>
  );
}

// Shows "___" in a question as a line, and screen readers say "blank".
function QuestionText({ text }: { text: string }) {
  const parts = text.split("___");
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <>
              <span
                aria-hidden="true"
                className="mx-1 inline-block w-16 border-b-2 border-text align-baseline"
              />
              <span className="sr-only">blank</span>
            </>
          )}
          {part}
        </Fragment>
      ))}
    </>
  );
}

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover";

// Multiple-choice quiz: one question at a time. Answers are checked here in
// code by comparing the picked option with `answer` (no AI call).
export default function Quiz({ questions }: { questions: PracticeQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  const answered = picked !== null;

  // After "Next question" or "Try again", move keyboard focus to the new
  // question (or the score), so keyboard and screen reader users start there.
  useEffect(() => {
    if (moveFocus.current) {
      headingRef.current?.focus();
      moveFocus.current = false;
    }
  }, [index, finished]);

  // When the feedback bar opens, move focus to its "Next question" button.
  // The button is linked to the feedback text (aria-describedby), so screen
  // readers read the button and the feedback together.
  useEffect(() => {
    if (answered) nextRef.current?.focus();
  }, [answered]);

  // Measure the feedback bar, so the same amount of empty space can be added
  // under the quiz. That way the bar never hides the question or options.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, [answered]);

  // If the options end up behind the bar, scroll up just enough to show them.
  useEffect(() => {
    const options = optionsRef.current;
    if (!answered || barHeight === 0 || !options) return;
    const hidden = options.getBoundingClientRect().bottom - (window.innerHeight - barHeight) + 16;
    if (hidden > 0) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: hidden, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }, [answered, barHeight]);

  if (questions.length === 0) {
    return <p className="mt-6 text-muted">This lesson has no practice questions yet.</p>;
  }

  const question = questions[index];
  const isCorrect = picked === question.answer;
  const isLast = index === questions.length - 1;

  function pick(option: string) {
    if (answered) return; // One try per question.
    setPicked(option);
    if (option === question.answer) setScore(score + 1);
  }

  function next() {
    moveFocus.current = true;
    if (isLast) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
    setPicked(null);
  }

  function tryAgain() {
    moveFocus.current = true;
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  }

  if (finished) {
    const perfect = score === questions.length;
    return (
      <div className="mt-6 rounded-xl border border-divider bg-background p-6">
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="text-lg font-semibold md:text-xl"
        >
          You got {score} of {questions.length} right
        </h3>
        <p className="mt-2">
          {perfect
            ? "Perfect score! Great job."
            : "Nice work! Try again to practice the questions you missed."}
        </p>
        <button type="button" onClick={tryAgain} className={`mt-6 ${primaryButton}`}>
          <Icon>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </Icon>
          Try again
        </button>
      </div>
    );
  }

  const questionId = `quiz-question-${index}`;
  const feedbackId = `quiz-feedback-${index}`;

  return (
    <>
      <div className="mt-6 rounded-xl border border-divider bg-background p-6">
        <p className="text-muted">
          Question {index + 1} of {questions.length}
        </p>
        <h3
          id={questionId}
          ref={headingRef}
          tabIndex={-1}
          className="mt-2 text-lg leading-relaxed font-semibold md:text-xl"
        >
          <QuestionText text={question.question} />
        </h3>

        <div
          ref={optionsRef}
          role="group"
          aria-labelledby={questionId}
          className="mt-6 flex flex-col gap-3"
        >
          {question.options.map((option) => {
            const showCorrect = answered && option === question.answer;
            const showWrong = answered && option === picked && !isCorrect;

            let style = "border-border bg-background text-text hover:border-primary";
            if (showCorrect) style = "border-correct-border bg-correct-bg text-correct-text font-bold";
            else if (showWrong) style = "border-mistake-line bg-mistake-bg text-text";
            else if (answered) style = "border-divider bg-background text-muted";

            return (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                // aria-disabled (not disabled) keeps the button focusable, so
                // keyboard focus isn't lost after answering.
                aria-disabled={answered}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-lg transition-colors aria-disabled:cursor-default ${style}`}
              >
                <span className="flex-1">{option}</span>
                {showCorrect && (
                  <span className="flex items-center gap-1 text-base">
                    <CheckIcon />
                    Correct
                  </span>
                )}
                {showWrong && (
                  <span className="flex items-center gap-1 text-base font-bold text-mistake-text">
                    <XIcon />
                    Your answer
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty space as tall as the feedback bar, so the page can scroll the
          question and options above it. */}
      <div aria-hidden="true" style={{ height: answered ? barHeight : 0 }} />

      {/* Feedback bar: fixed to the bottom of the screen. It slides up when it
          appears (starting: sets where the slide begins). With reduced motion
          on, it just appears. */}
      {answered && (
        <div
          ref={barRef}
          className={`fixed inset-x-0 bottom-0 z-10 border-t-4 transition-transform duration-300 ease-out starting:translate-y-full motion-reduce:transition-none ${
            isCorrect ? "border-correct-border bg-correct-bg" : "border-hint-border bg-hint-bg"
          }`}
        >
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:px-6">
            <div id={feedbackId} className="flex-1">
              {isCorrect ? (
                <p className="flex items-center gap-2 text-lg font-bold text-correct-text">
                  <CheckIcon />
                  You got it!
                </p>
              ) : (
                <>
                  <p className="flex items-center gap-2 text-lg font-bold text-hint-text">
                    <XIcon />
                    Not quite!
                  </p>
                  <p className="mt-1 font-bold text-text">
                    The answer is &ldquo;{question.answer}&rdquo;.
                  </p>
                </>
              )}
              <p className="mt-1 text-text">{question.explanation}</p>
            </div>
            <button
              ref={nextRef}
              type="button"
              onClick={next}
              aria-describedby={feedbackId}
              className={`w-full md:w-auto ${primaryButton}`}
            >
              {isLast ? "See my score" : "Next question"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
