"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { PracticeQuestion } from "@/app/lessons/lesson";
import { getQuizLengths } from "@/app/lessons/quiz-lengths";

// A shuffled copy of a list (Fisher–Yates: every order is equally likely).
function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// `count` random questions from the lesson, in random order, each with its
// options shuffled. Answers are still checked by text, so the order doesn't
// matter. Only called from button clicks, never while the page is drawn, so
// the server and the browser always draw the same first screen.
function pickQuestions(bank: PracticeQuestion[], count: number): PracticeQuestion[] {
  return shuffle(bank)
    .slice(0, count)
    .map((question) => ({ ...question, options: shuffle(question.options) }));
}

// Messages in the feedback. They take turns in this order, so the same one
// never shows twice in a row.
const CORRECT_MESSAGES = ["You got it!", "Nice!", "Great job!", "Perfect!"];
const WRONG_MESSAGES = ["Not quite!", "Almost!", "Good try!", "Keep going!"];

// Messages on the score screen, chosen by the team.
const SCORE_MESSAGES = {
  perfect: "Perfect! You know this rule.", // every answer right
  most: "So close! Just a few to fix.", // 75% or more right
  half: "Nice try! Try again to get more right.", // 50% or more right
  low: "Every mistake helps you learn. Try again!", // under 50% right
};

// Lessons can have up to 10 questions, so the message is picked by percentage.
function scoreMessage(score: number, total: number) {
  if (score === total) return SCORE_MESSAGES.perfect;
  if (score / total >= 0.75) return SCORE_MESSAGES.most;
  if (score / total >= 0.5) return SCORE_MESSAGES.half;
  return SCORE_MESSAGES.low;
}

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

function FlameIcon() {
  return (
    <Icon size={18}>
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
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

// The final score counts up from 0 (decoration: screen readers get the
// sentence instead).
function CountUp({ to }: { to: number }) {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v));
  useEffect(() => {
    // Never longer than 0.8s, even for a 10-question quiz.
    const controls = animate(value, to, { duration: Math.min(0.3 + to * 0.06, 0.8), ease: "easeOut" });
    return () => controls.stop();
  }, [value, to]);
  return <motion.span>{rounded}</motion.span>;
}

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover";

const outlineButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-6 py-3 font-bold text-primary transition-colors hover:bg-surface";

// Multiple-choice quiz: first the student picks how many questions, then
// answers them one at a time. Answers are checked here in code by comparing
// the picked option with `answer` (no AI call).
// `questions` is every question in the lesson; each quiz uses a random set.
// `next` is where the score screen's main button goes: the next lesson, or
// back to the list after the last lesson.
//
// Motion (motion.dev): a progress bar fills as questions are answered; each
// question slides in; a right answer pops and a wrong one shakes; the
// feedback springs up under the options, inside the quiz; the final score
// counts up, its check mark draws itself, and the review rows slide in. With
// "reduce motion" on, the movement is switched off (see
// components/MotionProvider.tsx).
export default function Quiz({
  questions: bank,
  next: nextLesson,
}: {
  questions: PracticeQuestion[];
  next: { href: string; label: string };
}) {
  const lengths = getQuizLengths(bank.length);
  // How many questions the slider is set to.
  const [count, setCount] = useState(lengths.start);
  // The questions for this quiz, or null while the student is still picking
  // how many.
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  // The option the student picked for each question so far, in order. The
  // score screen uses it to show which ones were right.
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  // The question shown blurred behind the slider; the quiz starts with it.
  // At first it's the lesson's first question as written (shuffling while
  // the page is drawn would make the server's and the browser's first
  // screen differ); "Change number of questions" picks a random one.
  const [preview, setPreview] = useState<PracticeQuestion | undefined>(bank[0]);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const moveFocus = useRef(false);

  const picked: string | null = answers[index] ?? null;
  const answered = picked !== null;

  // After "Start quiz", "Next question" or "Try again", move keyboard focus
  // to the new question (or the score), so keyboard and screen reader users
  // start there. After "Change number of questions", focus the slider.
  useEffect(() => {
    if (moveFocus.current) {
      (headingRef.current ?? sliderRef.current)?.focus();
      moveFocus.current = false;
    }
  }, [index, finished, questions]);

  // When the feedback appears, move focus to its "Next question" button and
  // make sure it's in view. The button is linked to the feedback text
  // (aria-describedby), so screen readers read them together.
  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus({ preventScroll: true });
    nextRef.current?.scrollIntoView({ block: "nearest" });
  }, [answered]);

  if (bank.length === 0 || !preview) {
    return <p className="text-muted">This lesson has no practice questions yet.</p>;
  }

  // "Start quiz": the preview question first, then random others.
  function start() {
    if (!preview) return;
    const others = bank.filter((question) => question.question !== preview.question);
    moveFocus.current = true;
    setQuestions([preview, ...pickQuestions(others, count - 1)]);
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  // "Try again": a fresh random set of the same size.
  function restart() {
    moveFocus.current = true;
    setQuestions(pickQuestions(bank, count));
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  // Back to the slider, keeping the last number picked, with a new preview.
  function changeCount() {
    moveFocus.current = true;
    setPreview(pickQuestions(bank, 1)[0]);
    setQuestions(null);
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  // First screen: how many questions. With 3 or fewer questions in the
  // lesson there's nothing to pick, so it only shows the number.
  if (questions === null) {
    const canPick = lengths.min < lengths.max;
    return (
      // The preview and the slider card share one grid cell, so the card
      // sits on top of the blurred question and the area is as tall as the
      // taller of the two. min-h-full + content-center put both in the
      // middle of the Practice side.
      <div className="grid min-h-full content-center">
        {/* Preview: the quiz's real first question, laid out like the quiz,
            blurred so it can't be read yet. Decoration only: screen readers
            skip it and it can't be clicked or focused (inert). */}
        <div
          aria-hidden="true"
          inert
          className="pointer-events-none [grid-area:1/1] opacity-70 blur-[6px] select-none"
        >
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-muted">Question 1 of {count}</p>
            <div className="h-2 flex-1 rounded-full bg-divider" />
          </div>
          <p className="mt-4 text-lg leading-relaxed font-semibold md:text-xl">
            <QuestionText text={preview.question} />
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {preview.options.map((option) => (
              <div
                key={option}
                className="flex min-h-12 items-center rounded-lg border-2 border-border bg-background px-4 py-2.5 text-lg"
              >
                {option}
              </div>
            ))}
          </div>
        </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="z-10 w-full max-w-md self-center justify-self-center [grid-area:1/1] rounded-xl border border-divider bg-background/90 p-5 shadow-lg backdrop-blur-sm"
      >
        {canPick ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="quiz-count" className="text-lg font-semibold md:text-xl">
                How many questions?
              </label>
              {/* The slider already tells screen readers the number. The
                  number pops each time it changes. */}
              <motion.span
                key={count}
                aria-hidden="true"
                initial={{ scale: 0.7, opacity: 0.4 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22 }}
                className="font-heading text-4xl font-bold text-heading tabular-nums"
              >
                {count}
              </motion.span>
            </div>
            {/* A native slider (keyboard and screen-reader friendly), in the
                main blue. h-12 keeps it a big tap target. */}
            <input
              ref={sliderRef}
              id="quiz-count"
              type="range"
              min={lengths.min}
              max={lengths.max}
              step={1}
              value={count}
              onChange={(event) => setCount(Number(event.target.value))}
              aria-valuetext={`${count} questions`}
              className="mt-1 h-12 w-full cursor-pointer accent-primary"
            />
            <div aria-hidden="true" className="flex justify-between text-muted tabular-nums">
              <span>{lengths.min}</span>
              <span>{lengths.max}</span>
            </div>
          </>
        ) : (
          <p className="text-lg font-semibold md:text-xl">
            {lengths.max} question{lengths.max === 1 ? "" : "s"}
          </p>
        )}
        <motion.button
          type="button"
          onClick={start}
          whileTap={{ scale: 0.97 }}
          className={`mt-5 w-full sm:w-auto ${primaryButton}`}
        >
          Start quiz
          <Icon>
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </Icon>
        </motion.button>
      </motion.div>
      </div>
    );
  }

  const question = questions[index];
  const isCorrect = picked === question.answer;
  const isLast = index === questions.length - 1;
  // How far through the quiz: answered questions out of all of them.
  const progress = answers.length / questions.length;

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

  if (finished) {
    const score = rightSoFar;
    const perfect = score === questions.length;
    const isLastLesson = nextLesson.href === "/lessons";
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <div className="flex flex-col items-center py-4 text-center">
          {/* The check mark draws itself inside a green circle, which pops a
              little more for a perfect score. */}
          <motion.span
            initial={{ scale: 0.6 }}
            animate={{ scale: perfect ? [0.6, 1.15, 1] : 1 }}
            transition={{ duration: 0.5 }}
            className="flex size-16 items-center justify-center rounded-full bg-correct-bg text-correct-text"
          >
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
          </motion.span>
          <h3
            ref={headingRef}
            tabIndex={-1}
            className="mt-4 text-lg font-semibold md:text-xl"
          >
            <span className="sr-only">
              {score} of {questions.length} questions right
            </span>
            <span aria-hidden="true">
              You got{" "}
              <span className="text-correct-text">
                <CountUp to={score} />
              </span>{" "}
              of {questions.length} right
            </span>
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
            <motion.button
              type="button"
              onClick={restart}
              whileTap={{ scale: 0.97 }}
              className={outlineButton}
            >
              <Icon>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </Icon>
              Try again
            </motion.button>
          </div>
          {/* Styled like the other text links. It's a button because it
              changes the quiz, not the page. */}
          {lengths.min < lengths.max && (
            <button
              type="button"
              onClick={changeCount}
              className="mt-3 inline-flex min-h-11 items-center font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
            >
              Change number of questions
            </button>
          )}
        </div>

        {/* Review: every question with the right answer filled in. A check
            means the student got it; an X shows what they picked instead.
            The rows slide in one after another. */}
        <h4 className="mt-6 font-heading text-lg font-semibold text-heading md:text-xl">
          Your answers
        </h4>
        <motion.ol
          className="mt-2"
          initial="hidden"
          animate="show"
          variants={{
            show: {
              transition: {
                delayChildren: 0.3,
                // Closer together for long quizzes, so the last row is in by about 0.6s.
                staggerChildren: Math.min(0.06, 0.3 / Math.max(questions.length - 1, 1)),
              },
            },
          }}
        >
          {questions.map((q, i) => {
            const correct = results[i];
            return (
              <motion.li
                key={i}
                variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                className="flex gap-3 border-b border-divider py-3 last:border-b-0"
              >
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
              </motion.li>
            );
          })}
        </motion.ol>
      </motion.div>
    );
  }

  const questionId = `quiz-question-${index}`;
  const feedbackId = `quiz-feedback-${index}`;
  const message = isCorrect
    ? CORRECT_MESSAGES[(rightSoFar - 1) % CORRECT_MESSAGES.length]
    : WRONG_MESSAGES[(wrongSoFar - 1) % WRONG_MESSAGES.length];

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

      {/* The first question comes into focus (it was the blurred preview);
          each next one slides in from the right, and the old one slides out
          to the left. */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={index === 0 ? { opacity: 0.6, filter: "blur(6px)" } : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
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
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <p className="flex items-center gap-2 text-lg font-bold text-correct-text">
                        <CheckIcon />
                        {message}
                      </p>
                      {/* Streak chip: pops in from 2 right answers in a row. */}
                      {streak >= 2 && (
                        <motion.p
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 18, delay: 0.15 }}
                          className="inline-flex items-center gap-1.5 rounded-full border-2 border-correct-border bg-background px-3 py-0.5 font-bold text-correct-text"
                        >
                          <FlameIcon />
                          {streak} in a row!
                        </motion.p>
                      )}
                    </div>
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
