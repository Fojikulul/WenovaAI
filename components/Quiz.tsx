"use client";

import Link from "next/link";
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import type { PracticeQuestion } from "@/app/lessons/lesson";
import "./Quiz.css";

// Messages in the feedback bar. They take turns in this order, so the same
// one never shows twice in a row.
const CORRECT_MESSAGES = ["You got it!", "Nice!", "Great job!", "Perfect!"];
const WRONG_MESSAGES = ["Not quite!", "Almost!", "Good try!", "Keep going!"];

// Messages on the score screen. The team writes the final wording.
const SCORE_MESSAGES = {
  perfect: "[MESSAGE FOR 100%]", // every answer right
  most: "[MESSAGE FOR 75%+]", // 75% or more right
  half: "[MESSAGE FOR 50%+]", // 50% or more right
  low: "[MESSAGE FOR BELOW 50%]", // under 50% right
};

// Lessons have 3-5 questions, so the message is picked by percentage.
function scoreMessage(score: number, total: number) {
  if (score === total) return SCORE_MESSAGES.perfect;
  if (score / total >= 0.75) return SCORE_MESSAGES.most;
  if (score / total >= 0.5) return SCORE_MESSAGES.half;
  return SCORE_MESSAGES.low;
}

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

// pathLength="1" lets Quiz.css draw the lines like a pen stroke.
function CheckIcon() {
  return (
    <Icon>
      <path pathLength={1} d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

function XIcon() {
  return (
    <Icon>
      <path pathLength={1} d="M18 6 6 18" />
      <path pathLength={1} d="m6 6 12 12" />
    </Icon>
  );
}

function FlameIcon() {
  return (
    <Icon>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </Icon>
  );
}

// Small dots that fly out from the middle of their parent and fade, for
// correct answers. Decoration only: screen readers skip it, clicks pass
// through, and with reduced motion on it isn't shown.
function Burst({ dots, big = false, delay }: { dots: number; big?: boolean; delay?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`quiz-burst ${big ? "quiz-burst-big" : ""}`}
      style={delay ? ({ "--burst-delay": delay } as CSSProperties) : undefined}
    >
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} style={{ "--angle": `${(360 / dots) * i}deg` } as CSSProperties} />
      ))}
    </span>
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
// The animations live in Quiz.css. They only decorate: the quiz works
// the same with them switched off (reduced motion).
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

  // Right or wrong for each answered question, for the messages and streak.
  const results = answers.map((answer, i) => answer === questions[i].answer);
  const rightSoFar = results.filter(Boolean).length;
  const wrongSoFar = results.length - rightSoFar;
  // How many right in a row, counting back from the latest answer.
  let streak = 0;
  for (let i = results.length - 1; i >= 0 && results[i]; i--) streak++;

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
    const score = rightSoFar;
    const perfect = score === questions.length;
    const isLastLesson = nextLesson.href === "/lessons";
    // The count-up takes 150ms per point, but never more than 600ms (a
    // lesson can have up to 5 questions).
    const countTime = Math.min(score * 150, 600);
    return (
      <div
        className="quiz quiz-rise mt-6 rounded-xl border border-divider bg-background p-6 md:p-8"
      >
        {/* Screen readers read the hidden sentence, not the counting number. */}
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="flex flex-wrap items-baseline gap-x-2"
        >
          <span className="sr-only">
            {score} of {questions.length} questions right
          </span>
          <span aria-hidden="true" className="relative text-5xl font-bold tabular-nums">
            <span
              className={perfect ? "quiz-count-perfect" : "quiz-count"}
              style={{ "--score": score, "--count-time": `${countTime}ms` } as CSSProperties}
            />
            {perfect && <Burst dots={16} big delay={`${countTime + 100}ms`} />}
          </span>
          <span aria-hidden="true" className="text-2xl font-semibold text-muted">
            of {questions.length}
          </span>
          <span aria-hidden="true" className="w-full text-lg font-semibold md:text-xl">
            questions right
          </span>
        </h3>
        <p className="mt-2">{scoreMessage(score, questions.length)}</p>

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
            const correct = results[i];
            return (
              <li
                key={i}
                className="quiz-row flex gap-3 border-b border-divider py-4 last:border-b-0"
                style={{ "--row": i } as CSSProperties}
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
  const message = isCorrect
    ? CORRECT_MESSAGES[(rightSoFar - 1) % CORRECT_MESSAGES.length]
    : WRONG_MESSAGES[(wrongSoFar - 1) % WRONG_MESSAGES.length];

  return (
    <div className="quiz">
      <div className="mt-6 rounded-xl border border-divider bg-background p-6">
        <p className="text-muted">
          Question {index + 1} of {questions.length}
        </p>
        {/* Progress bar: one piece per question, filled in navy once it's
            answered. The text above says the same, so screen readers skip it.
            The piece for the question just answered sweeps in, and puffs up
            if the answer was right. */}
        <div aria-hidden="true" className="mt-2 flex gap-1.5">
          {questions.map((q, i) => {
            const justAnswered = answered && i === index;
            return (
              <span
                key={i}
                className={`relative h-2 flex-1 overflow-hidden rounded-full bg-divider ${
                  justAnswered && isCorrect ? "quiz-segment-pop" : ""
                }`}
              >
                {i < answers.length && (
                  <span
                    className={`absolute inset-0 rounded-full bg-heading ${
                      justAnswered ? "quiz-fill" : ""
                    }`}
                  />
                )}
              </span>
            );
          })}
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

            // Right pick: pops. Wrong pick: shakes gently. The right answer
            // after a wrong pick: one soft glow, so the student sees it.
            let style = "border-border bg-background text-text hover:border-primary";
            let motion = "";
            if (showCorrect) {
              style = "border-correct-border bg-correct-bg text-correct-text font-bold";
              motion = isCorrect ? "quiz-pop" : "quiz-glow";
            } else if (showWrong) {
              style = "border-hint-border bg-hint-bg text-text";
              motion = "quiz-shake";
            } else if (answered) {
              style = "border-divider bg-background text-muted";
            }

            return (
              <button
                // The question number in the key gives each question fresh
                // buttons, so an animation never carries over.
                key={`${index}-${option}`}
                type="button"
                onClick={() => pick(option)}
                // aria-disabled (not disabled) keeps the button focusable, so
                // keyboard focus isn't lost after answering.
                aria-disabled={answered}
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg border-2 px-4 py-3 text-left text-lg transition-colors aria-disabled:cursor-default ${style} ${motion}`}
              >
                <span className="flex-1">{option}</span>
                {showCorrect && (
                  <span className="flex items-center gap-1 text-base">
                    {/* Only the student's own right pick draws in and bursts. */}
                    <span className={`relative ${isCorrect ? "quiz-draw-check" : ""}`}>
                      <CheckIcon />
                      {isCorrect && <Burst dots={8} />}
                    </span>
                    Correct
                  </span>
                )}
                {showWrong && (
                  <span className="flex items-center gap-1 text-base font-bold text-hint-text">
                    <span className="quiz-draw-x">
                      <XIcon />
                    </span>
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

      {/* Feedback bar: fixed to the bottom of the screen. It slides up with a
          slight overshoot when right, and calmly when wrong. With reduced
          motion on, it just appears. */}
      {answered && (
        <div
          ref={barRef}
          className={`fixed inset-x-0 bottom-0 z-10 border-t-4 ${
            isCorrect
              ? "quiz-bar-spring border-correct-border bg-correct-bg"
              : "quiz-bar-calm border-hint-border bg-hint-bg"
          }`}
        >
          <div className="mx-auto flex w-full max-w-[720px] flex-col gap-4 px-4 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] md:flex-row md:items-end md:px-6">
            <div id={feedbackId} className="flex-1">
              {isCorrect ? (
                <>
                  <p className="flex items-center gap-2 text-lg font-bold text-correct-text">
                    <CheckIcon />
                    {message}
                  </p>
                  {streak >= 2 && (
                    <p
                      className="quiz-chip mt-2 inline-flex items-center gap-1.5 rounded-full border-2 border-correct-border bg-background px-3 py-0.5 font-bold text-correct-text"
                    >
                      <FlameIcon />
                      {streak} in a row!
                    </p>
                  )}
                </>
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
        </div>
      )}
    </div>
  );
}
