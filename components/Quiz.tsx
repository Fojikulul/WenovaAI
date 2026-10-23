"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import type { PracticeQuestion } from "@/app/lessons/lesson";
import { getQuizLengths } from "@/app/lessons/quiz-lengths";
import { pickFresh, pickQuestions, questionKey, readSeen, saveSeen } from "@/lib/quiz-pick";

const CORRECT_MESSAGES = ["You got it!", "Nice!", "Great job!", "Perfect!"];
const WRONG_MESSAGES = ["Not quite!", "Almost!", "Good try!", "Keep going!"];

const SCORE_MESSAGES = {
  perfect: "Perfect! You know this rule.", // every answer right
  most: "So close! Just a few to fix.", // 75% or more right
  half: "Nice try! Try again to get more right.", // 50% or more right
  low: "Every mistake helps you learn. Try again!", // under 50% right
};

function scoreMessage(score: number, total: number) {
  if (score === total) return SCORE_MESSAGES.perfect;
  if (score / total >= 0.75) return SCORE_MESSAGES.most;
  if (score / total >= 0.5) return SCORE_MESSAGES.half;
  return SCORE_MESSAGES.low;
}

// Icons: path data from Lucide (lucide.dev), ISC license. They are decorative,
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

function splitMistakeQuestion(text: string) {
  const match = text.match(/^(Which word is wrong\?)\s*'(.+)'\s*$/);
  return match ? { prompt: match[1], sentence: match[2] } : null;
}

function sentenceChunks(sentence: string) {
  return sentence.split(/\s+/).map((chunk) => {
    const [, before, word, after] = chunk.match(/^([^A-Za-z0-9]*)(.*?)([^A-Za-z0-9]*)$/) ?? ["", "", chunk, ""];
    return { before, word, after };
  });
}

function MistakeSentence({
  sentence,
  options,
  answer,
  picked,
  onPick,
}: {
  sentence: string;
  options: string[];
  answer: string;
  picked: string | null;
  onPick?: (word: string) => void;
}) {
  const answered = picked !== null;
  return (
    <motion.p
      aria-hidden="true"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
      className="relative mt-3 flex flex-wrap items-center gap-x-1.5 gap-y-2 overflow-hidden rounded-xl border-l-4 border-primary bg-surface px-4 py-3 text-xl leading-snug"
    >
      <span className="pointer-events-none absolute inset-0 bg-linear-to-r from-primary/10 via-transparent to-logo-green/10" />
      {sentenceChunks(sentence).map((chunk, index) => {
        const tappable = options.includes(chunk.word);
        const isAnswer = answered && chunk.word === answer;
        const isWrongPick = answered && chunk.word === picked && picked !== answer;
        let style = "";
        if (tappable && !answered) {
          style =
            "cursor-pointer border-2 border-dashed border-primary bg-background px-2 font-bold text-heading hover:bg-primary/10";
        } else if (isAnswer) {
          style = "border-2 border-correct-border bg-correct-bg px-2 font-bold text-correct-text";
        } else if (isWrongPick) {
          style =
            "border-2 border-mistake-line bg-mistake-bg px-2 font-bold text-mistake-text line-through decoration-2";
        }
        return (
          <motion.span
            key={index}
            className="relative inline-flex items-center"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 26, delay: 0.1 + index * 0.03 }}
          >
            {chunk.before}
            {tappable ? (
              <motion.button
                type="button"
                tabIndex={-1}
                onClick={() => onPick?.(chunk.word)}
                disabled={answered || !onPick}
                className={`inline-flex min-h-11 items-center gap-1 rounded-lg transition-colors disabled:cursor-default ${style}`}
                whileHover={answered ? undefined : { y: -2 }}
                whileTap={answered ? undefined : { scale: 0.94 }}
                animate={
                  isWrongPick
                    ? { x: [0, -6, 6, -4, 4, 0] }
                    : isAnswer
                      ? { scale: [1, 1.15, 1] }
                      : { x: 0, scale: 1 }
                }
                transition={{ duration: 0.45 }}
              >
                {chunk.word}
                {isAnswer && (
                  <svg viewBox="0 0 24 24" className="size-5" fill="none">
                    <motion.path
                      d="M20 6 9 17l-5-5"
                      stroke="currentColor"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.35, delay: 0.15 }}
                    />
                  </svg>
                )}
              </motion.button>
            ) : (
              chunk.word
            )}
            {chunk.after}
          </motion.span>
        );
      })}
    </motion.p>
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

function CountUp({ to }: { to: number }) {
  const value = useMotionValue(0);
  const rounded = useTransform(value, (v) => Math.round(v));
  useEffect(() => {
    const controls = animate(value, to, { duration: Math.min(0.3 + to * 0.06, 0.8), ease: "easeOut" });
    return () => controls.stop();
  }, [value, to]);
  return <motion.span>{rounded}</motion.span>;
}

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover";

const outlineButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-6 py-3 font-bold text-primary transition-colors hover:bg-surface";

export default function Quiz({
  questions: bank,
  lessonId,
  next: nextLesson,
  suggestedCount,
  onFinish,
  scoreNote,
}: {
  questions: PracticeQuestion[];
  lessonId?: string;
  next: { href: string; label: string };
  suggestedCount?: number | null;
  onFinish?: (result: { score: number; total: number; durationSeconds: number }) => void;
  scoreNote?: ReactNode;
}) {
  const lengths = getQuizLengths(bank.length);
  const [pickedCount, setCount] = useState<number | null>(null);
  const count =
    pickedCount ??
    (suggestedCount ? Math.min(lengths.max, Math.max(lengths.min, suggestedCount)) : lengths.start);
  const [questions, setQuestions] = useState<PracticeQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [preview, setPreview] = useState<PracticeQuestion | undefined>(bank[0]);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const moveFocus = useRef(false);
  const startedAt = useRef(0);
  const seen = useRef<Set<string> | null>(null);

  const picked: string | null = answers[index] ?? null;
  const answered = picked !== null;

  useEffect(() => {
    if (moveFocus.current) {
      (headingRef.current ?? sliderRef.current)?.focus();
      moveFocus.current = false;
    }
  }, [index, finished, questions]);

  useEffect(() => {
    if (!answered) return;
    nextRef.current?.focus({ preventScroll: true });
    nextRef.current?.scrollIntoView({ block: "nearest" });
  }, [answered]);

  if (bank.length === 0 || !preview) {
    return <p className="text-muted">This lesson has no practice questions yet.</p>;
  }

  function newQuestions(first?: PracticeQuestion) {
    const { chosen, nextSeen } = pickFresh(bank, count, seen.current ?? readSeen(lessonId), first);
    seen.current = nextSeen;
    saveSeen(lessonId, nextSeen);
    return chosen;
  }

  function start() {
    if (!preview) return;
    moveFocus.current = true;
    startedAt.current = Date.now();
    setQuestions(newQuestions(preview));
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  function restart() {
    moveFocus.current = true;
    startedAt.current = Date.now();
    setQuestions(newQuestions());
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  function changeCount() {
    moveFocus.current = true;
    const alreadySeen = seen.current ?? readSeen(lessonId);
    const fresh = bank.filter((question) => !alreadySeen.has(questionKey(question)));
    setPreview(pickQuestions(fresh.length > 0 ? fresh : bank, 1)[0]);
    setQuestions(null);
    setIndex(0);
    setAnswers([]);
    setFinished(false);
  }

  if (questions === null) {
    const canPick = lengths.min < lengths.max;
    return (
      <div className="grid">
        <div
          aria-hidden="true"
          inert
          className="pointer-events-none [grid-area:1/1] opacity-90 blur-[5px] select-none"
        >
          <div className="flex items-center gap-3">
            <p className="shrink-0 text-muted">Question 1 of {count}</p>
            <div className="h-2 flex-1 rounded-full bg-divider" />
          </div>
          {(() => {
            const previewMistake = splitMistakeQuestion(preview.question);
            return previewMistake ? (
              <>
                <p className="mt-4 text-lg leading-relaxed font-semibold md:text-xl">{previewMistake.prompt}</p>
                <MistakeSentence
                  sentence={previewMistake.sentence}
                  options={preview.options}
                  answer={preview.answer}
                  picked={null}
                />
              </>
            ) : (
              <p className="mt-4 text-lg leading-relaxed font-semibold md:text-xl">
                <QuestionText text={preview.question} />
              </p>
            );
          })()}
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
        className="z-10 mx-4 self-center [grid-area:1/1] sm:mx-8 rounded-xl border border-divider bg-background/90 p-5 shadow-lg backdrop-blur-sm"
      >
        {canPick ? (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <label htmlFor="quiz-count" className="text-lg font-semibold md:text-xl">
                How many questions?
              </label>
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
  const total = questions.length;
  const progress = answers.length / questions.length;

  const results = answers.map((answer, i) => answer === questions[i].answer);
  const rightSoFar = results.filter(Boolean).length;
  const wrongSoFar = results.length - rightSoFar;
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
      onFinish?.({
        score: rightSoFar,
        total,
        durationSeconds: (Date.now() - startedAt.current) / 1000,
      });
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
          {scoreNote}

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
  const mistakeQuestion = splitMistakeQuestion(question.question);
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
          <motion.div
            className="h-full origin-left rounded-full bg-linear-to-r from-primary to-logo-green"
            initial={false}
            animate={{ scaleX: progress }}
            transition={{ type: "spring", stiffness: 200, damping: 26 }}
          />
        </div>
      </div>

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
            {mistakeQuestion ? (
              <>
                {mistakeQuestion.prompt}
                <span className="sr-only"> &ldquo;{mistakeQuestion.sentence}&rdquo;</span>
              </>
            ) : (
              <QuestionText text={question.question} />
            )}
          </h3>
          {mistakeQuestion && (
            <MistakeSentence
              sentence={mistakeQuestion.sentence}
              options={question.options}
              answer={question.answer}
              picked={picked}
              onPick={pick}
            />
          )}

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
                  aria-disabled={answered}
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
