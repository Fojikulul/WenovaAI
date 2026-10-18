import type { Metadata } from "next";
import Link from "next/link";
import { firstSentence, getLessons } from "./lesson";

export const metadata: Metadata = {
  title: "Lessons - Wenova",
};

// Arrow path data from Lucide (lucide.dev), ISC license. Decorative, so
// screen readers skip it.
function ArrowRightIcon() {
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
      className="mt-1 shrink-0"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

// Lesson list: one big card per lesson in data/lessons.json. Each card shows
// the title and the first sentence of the rule, and opens that lesson.
export default function LessonsPage() {
  const lessons = getLessons();

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">Lessons</h1>
      <p className="mt-4 text-muted">
        Pick a lesson. Read the rule, then practice with a short quiz.
      </p>

      <ol className="mt-10 flex flex-col gap-4">
        {lessons.map((lesson, index) => (
          <li key={lesson.id}>
            <Link
              href={`/lessons/${lesson.id}`}
              className="flex items-start gap-4 rounded-xl border border-divider bg-background p-6 transition-colors hover:border-primary"
            >
              {/* The list is numbered already, so screen readers skip this. */}
              <span
                aria-hidden="true"
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface font-heading font-semibold text-heading"
              >
                {index + 1}
              </span>
              <span className="flex flex-1 flex-col gap-1">
                <h2 className="text-lg leading-snug font-semibold md:text-xl">
                  {lesson.title}
                </h2>
                <span className="text-text">{firstSentence(lesson.rule)}</span>
              </span>
              <span className="text-muted">
                <ArrowRightIcon />
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
