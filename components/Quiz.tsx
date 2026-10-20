"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { PracticeQuestion } from "@/app/lessons/lesson";

// Icons: path data from Lucide (lucide.dev), ISC license. They are decorative,
// so screen readers skip them; the word next to each one says the same thing.
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

// The final score counts up from 0 (decoration: screen readers get the
// sentence under it).
function CountUp({ to }: { to: number }) {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(value, to, { duration: 0.8, ease: "easeOut" });
    return () => controls.stop();
  }, [value, to]);
  return <motion.span>{rounded}</motion.span>;
}

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover";

// Multiple-choice quiz: one question at a time. Answers are checked here in
// code by comparing the picked option with `answer` (no AI call).
//
// Motion (motion.dev): a progress bar fills as questions are answered; each
// question slides in; a right answer pops and a wrong one shakes; the
// feedback springs up under the options, inside the quiz; the final score
// counts up and its check mark draws itself. With "reduce motion" on, the
// movement is switched off (see components/MotionProvider.tsx).
export default function Quiz({ questions }: { questions: PracticeQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
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

  // When the feedback appears, move focus to its "Next question" button and
  // make sure it's in view. The button is linked to the feedback text
  // (aria-describedby), so screen readers read them together.
  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus({ preventScroll: true });
    nextRef.current?.scrollIntoView({ block: "nearest" });
  }, [answered]);

  if (questions.length === 0) {
    return <p className="text-muted">This lesson has no practice questions yet.</p>;
  }

  const question = questions[index];
  const isCorrect = picked === question.answer;
  const isLast = index === questions.length - 1;
  // How far through the quiz: answered questions out of all of them.
  const progress = (index + (answered ? 1 : 0)) / questions.length;

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
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="flex flex-col items-center py-6 text-center"
      >
        {/* The check mark draws itself inside a green circle. */}
        <span className="flex size-16 items-center justify-center rounded-full bg-correct-bg text-correct-text">
          <svg viewBox="0 0 24 24" className="size-8" aria-hidden="true">
            <motion.path
              d="M20 6 9 17l-5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            />
          </svg>
        </span>
        <h3
          ref={headingRef}
          tabIndex={-1}
          className="mt-4 text-lg font-semibold md:text-xl"
        >
          You got{" "}
          <span className="text-correct-text">
            <CountUp to={score} />
          </span>{" "}
          of {questions.length} right
        </h3>
        <p className="mt-2">
          {perfect
            ? "Perfect score! Great job."
            : "Nice work! Try again to practice the questions you missed."}
        </p>
        <motion.button
          type="button"
          onClick={tryAgain}
          whileTap={{ scale: 0.97 }}
          className={`mt-6 ${primaryButton}`}
        >
          <Icon>
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </Icon>
          Try again
        </motion.button>
      </motion.div>
    );
  }

  const questionId = `quiz-question-${index}`;
  const feedbackId = `quiz-feedback-${index}`;

  return (
    <div>
      {/* Progress: "Question 2 of 4" and a bar that fills as questions are
          answered (it grows with scaleX, which animates smoothly). */}
      <div className="flex items-center gap-3">
        <p className="shrink-0 text-muted">
          Question {index + 1} of {questions.length}
        </p>
        <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full bg-divider">
          <motion.div
            className="h-full origin-left rounded-full bg-linear-to-r from-primary to-logo-green"
            initial={false}
            animate={{ scaleX: progress }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>
      </div>

      {/* Each question slides in from the right, and the old one slides out
          to the left. */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        >
          <h3
            id={questionId}
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-lg leading-relaxed font-semibold md:text-xl"
          >
            <QuestionText text={question.question} />
          </h3>

          <div role="group" aria-labelledby={questionId} className="mt-4 flex flex-col gap-2.5">
            {question.options.map((option, position) => {
              const showCorrect = answered && option === question.answer;
              const showWrong = answered && option === picked && !isCorrect;

              let style = "border-border bg-background text-text hover:border-primary";
              if (showCorrect) style = "border-correct-border bg-correct-bg text-correct-text font-bold";
              else if (showWrong) style = "border-mistake-line bg-mistake-bg text-text";
              else if (answered) style = "border-divider bg-background text-muted";

              return (
                <motion.button
                  key={option}
                  type="button"
                  onClick={() => pick(option)}
                  // aria-disabled (not disabled) keeps the button focusable, so
                  // keyboard focus isn't lost after answering.
                  aria-disabled={answered}
                  // Options spring in one after another; afterwards the right
                  // answer pops and a wrong pick shakes.
                  initial={{ opacity: 0, y: 10 }}
                  animate={
                    showWrong
                      ? { opacity: 1, y: 0, x: [0, -8, 8, -6, 6, -3, 0] }
                      : showCorrect
                        ? { opacity: 1, y: 0, scale: [1, 1.04, 1] }
                        : { opacity: 1, y: 0 }
                  }
                  transition={{ duration: 0.4, delay: answered ? 0 : position * 0.05 }}
                  whileHover={answered ? undefined : { x: 4 }}
                  whileTap={answered ? undefined : { scale: 0.98 }}
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
                </motion.button>
              );
            })}
          </div>

          {/* The feedback springs up under the options. */}
          <AnimatePresence>
            {answered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`mt-4 flex flex-col gap-3 rounded-xl border-2 p-4 md:flex-row md:items-end ${
                  isCorrect ? "border-correct-border bg-correct-bg" : "border-hint-border bg-hint-bg"
                }`}
              >
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
                <motion.button
                  ref={nextRef}
                  type="button"
                  onClick={next}
                  aria-describedby={feedbackId}
                  whileTap={{ scale: 0.97 }}
                  className={`w-full md:w-auto ${primaryButton}`}
                >
                  {isLast ? "See my score" : "Next question"}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
