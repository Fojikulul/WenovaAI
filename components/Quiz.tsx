"use client";

import Link from "next/link";
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

// For the score review: the question with the right answer in the blank,
// e.g. "Water boils at 100 degrees Celsius." A question with no blank
// shows the answer on its own line.
function FilledQuestion({ text, answer }: { text: string; answer: string }) {
  const parts = text.split("___");
  if (parts.length === 1) {
    return (
      <>
        {text}
        <strong className="block">{answer}</strong>
      </>
    );
  }
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>
          {index > 0 && <strong>{answer}</strong>}
          {part}
        </Fragment>
      ))}
    </>
  );
}

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover";

const outlineButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-6 py-3 font-bold text-primary transition-colors hover:bg-surface";

// Multiple-choice quiz: one question at a time. Answers are checked here in
// code by comparing the picked option with `answer` (no AI call).
// `next` is where the score screen's main button goes: the next lesson, or
// back to the list after the last lesson.
export default function Quiz({
  questions,
  next: nextLesson,
}: {
  questions: PracticeQuestion[];
  next: { href: string; label: string };
}) {
  const [index, setIndex] = useState(0);
  // The option the student picked for each question so far, in order. The
  // score screen uses it to show which ones were right.
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [barHeight, setBarHeight] = useState(0);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  const picked: string | null = answers[index] ?? null;
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
    setAnswers([...answers, option]);
  }

  function next() {
    moveFocus.current = true;
    if (isLast) {
      setFinished(true);
    } else {
      setIndex(index + 1);
    }
  }

  function tryAgain() {
    moveFocus.current = true;
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  if (finished) {
    const score = questions.filter((q, i) => answers[i] === q.answer).length;
    const perfect = score === questions.length;
    const isLastLesson = nextLesson.href === "/lessons";
    return (
      <div className="mt-6 rounded-xl border border-divider bg-background p-6 md:p-8">
        {/* The whole heading is read as one: "3 of 4 questions right". */}
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="flex flex-wrap items-baseline gap-x-2"
        >
          <span className="text-5xl font-bold">{score}</span>{" "}
          <span className="text-2xl font-semibold text-muted">of {questions.length}</span>{" "}
          <span className="w-full text-lg font-semibold md:text-xl">questions right</span>
        </h3>
        <p className="mt-2">
          {perfect
            ? "Perfect score! Great job."
            : "Nice work! Try again to practice the questions you missed."}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href={nextLesson.href} className={primaryButton}>
            {isLastLesson && (
              <Icon>
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </Icon>
            )}
            {nextLesson.label}
            {!isLastLesson && (
              <Icon>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </Icon>
            )}
          </Link>
          <button type="button" onClick={tryAgain} className={outlineButton}>
            <Icon>
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </Icon>
            Try again
          </button>
        </div>

        {/* Review: every question with the right answer filled in. A check
            means the student got it; an X shows what they picked instead. */}
        <h4 className="mt-10 font-heading text-lg font-semibold text-heading md:text-xl">
          Your answers
        </h4>
        <ol className="mt-2">
          {questions.map((q, i) => {
            const correct = answers[i] === q.answer;
            return (
              <li
                key={i}
                className="flex gap-3 border-b border-divider py-4 last:border-b-0"
              >
                <span className={`mt-1 ${correct ? "text-correct-text" : "text-hint-text"}`}>
                  {correct ? <CheckIcon /> : <XIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="sr-only">{correct ? "Correct: " : "Not quite: "}</span>
                    <FilledQuestion text={q.question} answer={q.answer} />
                  </p>
                  {!correct && (
                    <p className="mt-1 text-muted">Your answer: {answers[i]}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
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
        {/* Progress bar: one piece per question, filled in navy once it's
            answered. The text above says the same, so screen readers skip it. */}
        <div aria-hidden="true" className="mt-2 flex gap-1.5">
          {questions.map((q, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-full ${i < answers.length ? "bg-heading" : "bg-divider"}`}
            />
          ))}
        </div>
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
