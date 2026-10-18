import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { firstSentence, getLessonGroups } from "./lesson";

export const metadata: Metadata = {
  title: "Lessons - Wenova",
};

// Icons: path data from Lucide (lucide.dev), ISC license. They are decorative,
// so screen readers skip them; the text next to each one says the same thing.
function Icon({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

function ClockIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </Icon>
  );
}

function BookIcon() {
  return (
    <Icon>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Icon>
  );
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Lesson list: the lessons in sections that open and close (Verb Tenses,
// Grammar Basics). <details> and <summary> are built into HTML, so keyboard
// and screen reader support work without any JavaScript.
export default function LessonsPage() {
  const groups = getLessonGroups();

  // Number the lessons 1-12 across all sections, in the order shown: each
  // section starts after the lessons in the sections before it.
  const countLessons = (list: typeof groups) =>
    list.reduce((sum, group) => sum + group.lessons.length, 0);
  const numberedGroups = groups.map((group, index) => ({
    ...group,
    start: countLessons(groups.slice(0, index)) + 1,
  }));
  const lessonCount = countLessons(groups);

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12 md:px-6 md:py-16">
      {/* A short bar in the logo's bright green, for decoration only. */}
      <span aria-hidden="true" className="block h-1.5 w-12 rounded-full bg-logo-green" />
      <h1 className="mt-4 text-[1.75rem] leading-tight font-bold md:text-4xl">
        Let&apos;s practice English grammar
      </h1>
      <p className="mt-4 text-muted">
        {lessonCount} short lessons. Each one has a rule, an example, and a quick quiz.
      </p>

      <div className="mt-10 flex flex-col gap-8">
        {numberedGroups.map((group) => (
          <details key={group.id} open className="group">
            <summary className="flex min-h-12 cursor-pointer list-none items-center gap-3 rounded-lg py-2 [&::-webkit-details-marker]:hidden">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-surface text-heading">
                {group.id === "verb-tenses" ? <ClockIcon /> : <BookIcon />}
              </span>
              <h2 className="flex-1 text-[1.375rem] leading-snug font-semibold md:text-[1.75rem]">
                {group.title}
              </h2>
              <span className="text-muted">{plural(group.lessons.length, "lesson")}</span>
              {/* Points down when closed and turns to point up when open. */}
              <Icon className="text-muted transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none">
                <path d="m6 9 6 6 6-6" />
              </Icon>
            </summary>

            <ol start={group.start} className="mt-4 flex flex-col gap-4">
              {group.lessons.map((lesson, index) => (
                <li key={lesson.id}>
                  <Link
                    href={`/lessons/${lesson.id}`}
                    className="flex items-start gap-4 rounded-xl border border-divider bg-background p-5 transition-colors hover:border-primary md:p-6"
                  >
                    {/* The list is numbered already, so screen readers skip this. */}
                    <span
                      aria-hidden="true"
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-tag-bg font-heading text-lg font-bold text-tag-text"
                    >
                      {group.start + index}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <h3 className="text-lg leading-snug font-semibold md:text-xl">
                        {lesson.title}
                      </h3>
                      <span>{firstSentence(lesson.rule)}</span>
                      <span className="mt-1 font-bold text-muted">
                        {plural(lesson.practice.length, "question")}
                      </span>
                    </span>
                    <Icon className="mt-2 text-muted">
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </Icon>
                  </Link>
                </li>
              ))}
            </ol>
          </details>
        ))}
      </div>
    </div>
  );
}
