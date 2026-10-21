import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import Quiz from "@/components/Quiz";
import { getLesson, getLessonPosition, getLessons, ruleSentences } from "../lesson";
import { getQuizLengths } from "../quiz-lengths";

// Build all 12 lesson pages ahead of time, one per id in data/lessons.json.
export function generateStaticParams() {
  return getLessons().map((lesson) => ({ id: lesson.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/lessons/[id]">): Promise<Metadata> {
  const { id } = await params;
  const lesson = getLesson(id);
  return { title: lesson ? `${lesson.title} - Wenova` : "Lesson not found - Wenova" };
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

// One lesson. This project uses Cache Components, so a lesson id that isn't
// one of the 12 above is only known when someone visits. Reading it inside
// <Suspense> lets Next.js show "Loading lesson…" while it checks the id.
export default function LessonPage({ params }: PageProps<"/lessons/[id]">) {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12 md:px-6 md:py-16">
      <Suspense fallback={<p className="text-muted">Loading lesson…</p>}>
        <LessonContent params={params} />
      </Suspense>
    </div>
  );
}

// A rough time to finish a lesson: 1 minute to read the rule card, plus
// about 30 seconds for each question, rounded up.
function minutesToFinish(questionCount: number) {
  return Math.ceil(1 + questionCount * 0.5);
}

// "3–10" on screen, "3 to 10" for screen readers, or one number if both are
// the same.
function Range({ from, to }: { from: number; to: number }) {
  if (from === to) return <>{to}</>;
  return (
    <>
      <span aria-hidden="true">
        {from}–{to}
      </span>
      <span className="sr-only">
        {from} to {to}
      </span>
    </>
  );
}

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) {
    notFound();
  }

  const position = getLessonPosition(lesson.id);
  const lengths = getQuizLengths(lesson.practice.length);
  // Where to go after this lesson. The last lesson goes back to the list.
  const next = position?.next
    ? { href: `/lessons/${position.next.id}`, label: "Next lesson" }
    : { href: "/lessons", label: "Back to all lessons" };

  return (
    <>
      <Link
        href="/lessons"
        className="inline-flex min-h-11 items-center gap-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
      >
        <Icon>
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </Icon>
        All lessons
      </Link>

      {/* Header: where this lesson is in the list, its title, and its size. */}
      {position && (
        <p className="mt-6 font-bold text-muted">
          {position.groupTitle}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          Lesson {position.number} of {position.total}
        </p>
      )}
      <h1 className="mt-1 text-[1.75rem] leading-tight font-bold md:text-4xl">
        {lesson.title}
      </h1>
      {/* The student picks how many questions before the quiz starts, so
          this shows the range, e.g. "3–10 questions · about 3–6 min". */}
      <p className="mt-2 text-muted">
        <Range from={lengths.min} to={lengths.max} /> question{lengths.max === 1 ? "" : "s"}
        <span aria-hidden="true"> · </span>
        <span className="sr-only">, </span>
        about <Range from={minutesToFinish(lengths.min)} to={minutesToFinish(lengths.max)} /> min
      </p>

      {/* Rule card: the rule as short points, one example, and a common
          mistake fixed. */}
      <section
        aria-labelledby="rule-title"
        className="mt-8 rounded-xl border border-divider bg-background p-6 md:p-8"
      >
        <h2 id="rule-title" className="text-[1.375rem] leading-snug font-semibold md:text-[1.75rem]">
          The rule
        </h2>
        {/* One point per sentence. max-w-[65ch] keeps lines short enough
            to read easily on big screens. */}
        <ul className="mt-4 flex max-w-[65ch] flex-col gap-3">
          {ruleSentences(lesson.rule).map((sentence, index) => (
            <li key={index} className="flex gap-3">
              {/* A small green dot, for decoration only. calc() puts it in
                  the middle of the first line. */}
              <span
                aria-hidden="true"
                className="mt-[calc(0.8em-0.25rem)] size-2 shrink-0 rounded-full bg-logo-green"
              />
              <span>{sentence}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-8 text-lg font-semibold md:text-xl">Example</h3>
        <p className="mt-3 rounded-lg border-l-4 border-logo-green bg-surface px-4 py-3 text-lg">
          {lesson.example}
        </p>

        <h3 className="mt-8 text-lg font-semibold md:text-xl">Common mistake</h3>
        {/* Stacked on phones, side by side from tablet size up. */}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
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
      </section>

      <section aria-labelledby="practice-title" className="mt-12">
        <h2
          id="practice-title"
          className="text-[1.375rem] leading-snug font-semibold md:text-[1.75rem]"
        >
          Practice
        </h2>
        <p className="mt-2 text-muted">Pick the right answer for each question.</p>
        {/* The key starts the quiz fresh if the student opens another lesson. */}
        <Quiz key={lesson.id} questions={lesson.practice} next={next} />
      </section>

      {/* Link to the next lesson (or back to the list after the last one),
          for students who skip the quiz. */}
      <nav aria-label="Next lesson" className="mt-12 border-t border-divider pt-6">
        <Link
          href={next.href}
          className="inline-flex min-h-11 items-center gap-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
        >
          {position?.next ? (
            <>
              Next lesson: {position.next.title}
              <Icon>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </Icon>
            </>
          ) : (
            <>
              <Icon>
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </Icon>
              {next.label}
            </>
          )}
        </Link>
      </nav>
    </>
  );
}
