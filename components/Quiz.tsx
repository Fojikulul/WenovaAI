"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { PracticeQuestion } from "@/app/lessons/lesson";

const CORRECT_MESSAGES = ["You got it!", "Nice!", "Great job!", "Perfect!"];
const WRONG_MESSAGES = ["Not quite!", "Almost!", "Good try!", "Keep going!"];

const SCORE_MESSAGES = {
  perfect: "Perfect! You know this rule.",
  most: "So close! Just a few to fix.",
  half: "Nice try! Try again to get more right.",
  low: "Every mistake helps you learn. Try again!",
};

function scoreMessage(score: number, total: number) {
  if (score === total) return SCORE_MESSAGES.perfect;
  if (score / total >= 0.75) return SCORE_MESSAGES.most;
  if (score / total >= 0.5) return SCORE_MESSAGES.half;
  return SCORE_MESSAGES.low;
}

// Icon paths from Lucide (lucide.dev), ISC license.
function Icon({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
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

export default function Quiz({
  questions,
  next: nextLesson,
}: {
  questions: PracticeQuestion[];
  next: { href: string; label: string };
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  const picked: string | null = answers[index] ?? null;
  const answered = picked !== null;

  useEffect(() => {
    if (moveFocus.current) {
      headingRef.current?.focus();
      moveFocus.current = false;
    }
  }, [index, finished]);

  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus({ preventScroll: true });
    nextRef.current?.scrollIntoView({ block: "nearest" });
  }, [answered]);

  if (questions.length === 0) {
    return <p className="text-muted">This lesson has no practice questions yet.</p>;
  }

  function restart() {
    moveFocus.current = true;
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  const question = questions[index];
  const isCorrect = picked === question.answer;
  const isLast = index === questions.length - 1;
  const progress = answers.length / questions.length;

  const results = answers.map((answer, i) => answer === questions[i].answer);
  const rightSoFar = results.filter(Boolean).length;
  const wrongSoFar = results.length - rightSoFar;

  function pick(option: string) {
    if (answered) return;
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

  if (finished) {
    const score = rightSoFar;
    const isLastLesson = nextLesson.href === "/lessons";
    return (
      <div>
        <div className="flex flex-col items-center py-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-correct-bg text-correct-text">
            <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
              <path
                d="M20 6 9 17l-5-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-lg font-semibold md:text-xl"
          >
            You got <span className="text-correct-text">{score}</span> of {questions.length} right
          </h3>
          <p className="mt-2">{scoreMessage(score, questions.length)}</p>

          <div className="mt-6 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
            <button type="button" onClick={restart} className={outlineButton}>
              <Icon>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </Icon>
              Try again
            </button>
          </div>
        </div>

        <h4 className="mt-6 font-heading text-lg font-semibold text-heading md:text-xl">
          Your answers
        </h4>
        <ol className="mt-2">
          {questions.map((q, i) => {
            const correct = results[i];
            return (
              <li key={i} className="flex gap-3 border-b border-divider py-3 last:border-b-0">
                <span className={`mt-1 ${correct ? "text-correct-text" : "text-hint-text"}`}>
                  {correct ? <CheckIcon /> : <XIcon />}
                </span>
                <div className="min-w-0 flex-1">
                  <p>
                    <span className="sr-only">{correct ? "Correct: " : "Not quite: "}</span>
                    <FilledQuestion text={q.question} answer={q.answer} />
                  </p>
                  {!correct && <p className="mt-1 text-muted">Your answer: {answers[i]}</p>}
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
  const message = isCorrect
    ? CORRECT_MESSAGES[(rightSoFar - 1) % CORRECT_MESSAGES.length]
    : WRONG_MESSAGES[(wrongSoFar - 1) % WRONG_MESSAGES.length];

  return (
    <div>
      <div className="flex items-center gap-3">
        <p className="shrink-0 text-muted">
          Question {index + 1} of {questions.length}
        </p>
        <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-divider">
          <div
            className="h-full rounded-full bg-linear-to-r from-primary to-logo-green transition-[width] duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      <h3
        id={questionId}
        ref={headingRef}
        tabIndex={-1}
        className="mt-4 text-lg leading-relaxed font-semibold md:text-xl"
      >
        <QuestionText text={question.question} />
      </h3>

      <div role="group" aria-labelledby={questionId} className="mt-4 flex flex-col gap-2.5">
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
              // aria-disabled (not disabled) keeps the button focusable, so keyboard focus isn't lost after answering.
              aria-disabled={answered}
              className={`flex min-h-12 w-full items-center gap-3 rounded-lg border-2 px-4 py-2.5 text-left text-lg transition-colors aria-disabled:cursor-default ${style}`}
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

      {answered && (
        <div
          className={`mt-4 flex flex-col gap-3 rounded-xl border-2 p-4 md:flex-row md:items-end ${
            isCorrect ? "border-correct-border bg-correct-bg" : "border-hint-border bg-hint-bg"
          }`}
        >
          <div id={feedbackId} className="flex-1">
            {isCorrect ? (
              <p className="flex items-center gap-2 text-lg font-bold text-correct-text">
                <CheckIcon />
                {message}
              </p>
            ) : (
              <>
                <p className="flex items-center gap-2 text-lg font-bold text-hint-text">
                  <XIcon />
                  {message}
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
      )}
    </div>
  );
}
