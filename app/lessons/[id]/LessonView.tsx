"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import Quiz from "@/components/Quiz";
import RuleText from "@/components/RuleText";
import type { Lesson, LessonCard } from "../lesson";

// Icon paths from Lucide (lucide.dev), ISC license.
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

export default function LessonView({
  lesson,
  rulePoints,
  previous,
  next,
  quizNext,
}: {
  lesson: Lesson;
  rulePoints: string[];
  previous?: LessonCard;
  next?: LessonCard;
  quizNext: { href: string; label: string };
}) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-divider bg-background shadow-sm">
      <div aria-hidden="true" className="h-1 shrink-0 bg-linear-to-r from-primary to-logo-green" />

      <div className="grid min-h-0 flex-1 lg:grid-cols-2">
        <section
          aria-labelledby="rule-title"
          className="flex min-h-0 flex-col border-b border-divider lg:border-r lg:border-b-0"
        >
          <div className="flex min-h-14 shrink-0 items-center px-4 md:px-5">
            <h2 id="rule-title" className={paneTitle}>
              The rule
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 md:px-5">
            <ul className="flex max-w-[65ch] flex-col gap-3">
              {rulePoints.map((sentence, index) => (
                <li key={index} className="flex gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[calc(0.8em-0.25rem)] size-2 shrink-0 rounded-full bg-logo-green"
                  />
                  <span>
                    <RuleText text={sentence} />
                  </span>
                </li>
              ))}
            </ul>

            <h3 className="mt-6 text-lg font-semibold">Example</h3>
            <p className="mt-2 rounded-lg bg-surface px-4 py-3 text-lg">{lesson.example}</p>

            <h3 className="mt-6 text-lg font-semibold">Common mistake</h3>
            <div className="mt-2 flex flex-col gap-3">
              <div className="rounded-lg bg-mistake-bg px-4 py-3">
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
              </div>
              <div className="rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3">
                <p className="flex items-center gap-2 font-bold text-correct-text">
                  <Icon>
                    <path d="M20 6 9 17l-5-5" />
                  </Icon>
                  Right
                </p>
                <p className="mt-1 text-lg">{lesson.mistake.right}</p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="practice-title" className="flex min-h-0 flex-col">
          <div className="flex min-h-14 shrink-0 items-center px-4 md:px-5">
            <h2 id="practice-title" className={paneTitle}>
              Practice
            </h2>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 md:px-5">
            <Quiz key={lesson.id} questions={lesson.practice} lessonId={lesson.id} next={quizNext} />
          </div>
        </section>
      </div>

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
