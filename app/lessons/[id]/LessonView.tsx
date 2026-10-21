"use client";

import { motion, type Variants } from "motion/react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import Quiz from "@/components/Quiz";
import { getPreferredQuizLength, saveQuizResult, type QuizSaveResult } from "@/lib/quiz-actions";
import type { Lesson, LessonCard } from "../lesson";

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

const paneTitle = "text-lg leading-snug font-semibold md:text-xl";
const navLink =
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover";

// Each part of the rule card springs up into place, one after another.
const springIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

// One lesson as one card, like the Essay Checker: the rule on the left, the
// quiz on the right, and a bottom bar to move to the previous or next
// lesson. From 1024px up it fills the window under the hero and each side
// scrolls on its own; on smaller screens the sides stack.
export default function LessonView({
  lesson,
  rulePoints,
  previous,
  next,
  quizNext,
}: {
  lesson: Lesson;
  rulePoints: string[]; // the rule split into sentences (ruleSentences in lesson.ts)
  previous?: LessonCard;
  next?: LessonCard;
  quizNext: { href: string; label: string };
}) {
  // Signed-in students: the slider starts at their preferred difficulty's
  // length, and each finished quiz is saved to their progress.
  const [suggestedCount, setSuggestedCount] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<"saving" | QuizSaveResult | null>(null);

  useEffect(() => {
    let current = true;
    getPreferredQuizLength()
      .then((length) => {
        if (current) setSuggestedCount(length);
      })
      // Not signed in or offline: the quiz just uses its normal start.
      .catch(() => {});
    return () => {
      current = false;
    };
  }, []);

  function finishQuiz(result: { score: number; total: number; durationSeconds: number }) {
    setSaveState("saving");
    saveQuizResult(lesson.id, result.score, result.total, result.durationSeconds)
      .then(setSaveState)
      .catch(() => setSaveState("failed"));
  }

  // The line under the score: whether the result was saved.
  const scoreNote =
    saveState === "saving" ? (
      <p className="mt-2 text-muted" role="status">
        Saving to your progress…
      </p>
    ) : saveState === "saved" ? (
      <p className="mt-2 font-bold text-correct-text" role="status">
        Saved to your progress.{" "}
        <Link href="/progress" className="text-secondary underline underline-offset-[3px] hover:text-secondary-hover">
          See My progress
        </Link>
      </p>
    ) : saveState === "signed-out" ? (
      <p className="mt-2 text-muted" role="status">
        <Link href="/login" className="font-bold text-secondary underline underline-offset-[3px] hover:text-secondary-hover">
          Sign in
        </Link>{" "}
        to save your quiz results and get a learning path.
      </p>
    ) : saveState === "failed" ? (
      <p className="mt-2 text-hint-text" role="status">
        We couldn&apos;t save this result. Your score above is still right.
      </p>
    ) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-divider bg-background shadow-sm">
      {/* The gradient line along the top, in the logo's blue and green. */}
      <div aria-hidden="true" className="h-1 shrink-0 bg-linear-to-r from-primary to-logo-green" />

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        {/* Left: the rule, an example, and a common mistake fixed. */}
        <section
          aria-labelledby="rule-title"
          className="flex min-h-0 flex-col border-b border-divider lg:border-r lg:border-b-0"
        >
          <div className="flex min-h-14 shrink-0 items-center px-4 md:px-5">
            <h2 id="rule-title" className={paneTitle}>
              The rule
            </h2>
          </div>
          <motion.div
            className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 md:px-5"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
          >
            {/* The rule as short points, one per sentence. */}
            <ul className="flex max-w-[65ch] flex-col gap-3">
              {rulePoints.map((sentence, index) => (
                <motion.li key={index} variants={springIn} className="flex gap-3">
                  {/* A small green dot, for decoration only. calc() puts it
                      in the middle of the first line. */}
                  <span
                    aria-hidden="true"
                    className="mt-[calc(0.8em-0.25rem)] size-2 shrink-0 rounded-full bg-logo-green"
                  />
                  <span>{sentence}</span>
                </motion.li>
              ))}
            </ul>

            <motion.div variants={springIn}>
              <h3 className="mt-6 text-lg font-semibold">Example</h3>
              <p className="mt-2 rounded-lg bg-surface px-4 py-3 text-lg">{lesson.example}</p>
            </motion.div>

            <motion.div variants={springIn}>
              <h3 className="mt-6 text-lg font-semibold">Common mistake</h3>
            </motion.div>
            <div className="mt-2 flex flex-col gap-3">
              <motion.div variants={springIn} className="rounded-lg bg-mistake-bg px-4 py-3">
                <p className="flex items-center gap-2 font-bold text-mistake-text">
                  <Icon>
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </Icon>
                  Wrong
                </p>
                <p className="mt-1 text-lg underline decoration-mistake-line decoration-wavy decoration-2 underline-offset-4">
                  {lesson.mistake.wrong}
                </p>
              </motion.div>
              <motion.div
                variants={springIn}
                className="rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3"
              >
                <p className="flex items-center gap-2 font-bold text-correct-text">
                  <Icon>
                    <path d="M20 6 9 17l-5-5" />
                  </Icon>
                  Right
                </p>
                <p className="mt-1 text-lg">{lesson.mistake.right}</p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Right: the quiz. The id "practice-title" is what other pages link
            to ("Practice this rule"). */}
        <section aria-labelledby="practice-title" className="flex min-h-0 flex-col">
          <div className="flex min-h-14 shrink-0 items-center px-4 md:px-5">
            <h2 id="practice-title" className={paneTitle}>
              Practice
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 md:px-5">
            {/* The key starts the quiz fresh if the student opens another lesson. */}
            <Quiz
              key={lesson.id}
              questions={lesson.practice}
              next={quizNext}
              suggestedCount={suggestedCount}
              onFinish={finishQuiz}
              scoreNote={scoreNote}
            />
          </div>
        </section>
      </div>

      {/* Bottom bar: move through the lessons in order. */}
      <nav
        aria-label="Other lessons"
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-divider bg-surface px-3 py-2 md:px-4"
      >
        {previous ? (
          <Link href={`/lessons/${previous.id}`} className={navLink}>
            <Icon>
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </Icon>
            <span>
              <span className="sr-only">Previous lesson: </span>
              {previous.title}
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/lessons/${next.id}`} className={`${navLink} ml-auto`}>
            <span>
              <span className="sr-only">Next lesson: </span>
              {next.title}
            </span>
            <Icon>
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </Icon>
          </Link>
        )}
      </nav>
    </div>
  );
}
