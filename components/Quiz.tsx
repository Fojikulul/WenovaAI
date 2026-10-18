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

function LightbulbIcon() {
  return (
    <Icon>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
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

  // After "Next question" or "Try again", move keyboard focus to the new
  // question (or the score), so keyboard and screen reader users start there.
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moveFocus = useRef(false);
  useEffect(() => {
    if (moveFocus.current) {
      headingRef.current?.focus();
      moveFocus.current = false;
    }
  }, [index, finished]);

  if (questions.length === 0) {
    return <p className="mt-6 text-muted">This lesson has no practice questions yet.</p>;
  }

  const question = questions[index];
  const answered = picked !== null;
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
      setPicked(null);
    }
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

  return (
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

      <div role="group" aria-labelledby={questionId} className="mt-6 flex flex-col gap-3">
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

      {/* Screen readers read this out as soon as the student answers. */}
      <div aria-live="polite">
        {answered &&
          (isCorrect ? (
            <div className="mt-6 rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3">
              <p className="flex items-center gap-2 font-bold text-correct-text">
                <CheckIcon />
                You got it!
              </p>
              <p className="mt-1 text-text">{question.explanation}</p>
            </div>
          ) : (
            <div className="mt-6 rounded-lg border-2 border-hint-border bg-hint-bg px-4 py-3">
              <p className="flex items-center gap-2 font-bold text-hint-text">
                <LightbulbIcon />
                Good try!
              </p>
              <p className="mt-1 text-text">
                The answer is &ldquo;{question.answer}&rdquo;. {question.explanation}
              </p>
            </div>
          ))}
      </div>

      {answered && (
        <button type="button" onClick={next} className={`mt-6 ${primaryButton}`}>
          {isLast ? "See my score" : "Next question"}
        </button>
      )}
    </div>
  );
}
