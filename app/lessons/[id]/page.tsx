import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HeroBackdrop from "@/components/HeroBackdrop";
import HeroPill from "@/components/HeroPill";
import { getLesson, getLessonPlace, getLessons, ruleSentences } from "../lesson";
import { getQuizLengths } from "../quiz-lengths";
import LessonView from "./LessonView";

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

// One lesson, in the same style as the home page: a short hero, then one
// card with the rule and the quiz. From 1024px up it fills the window, so
// the page doesn't scroll. This project uses Cache Components, so a lesson
// id that isn't one of the 12 is only known when someone visits; reading it
// inside <Suspense> lets Next.js show "Loading lesson…" while it checks.
export default function LessonPage({ params }: PageProps<"/lessons/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col px-4 pb-4 md:px-6 lg:h-[calc(100dvh-var(--header-height)-var(--footer-height))] lg:min-h-[40rem]">
      <Suspense fallback={<p className="py-12 text-center text-muted">Loading lesson…</p>}>
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
  const place = getLessonPlace(id);
  if (!lesson || !place) {
    notFound();
  }

  const lengths = getQuizLengths(lesson.practice.length);
  // Where the quiz's score screen sends the student next. The last lesson
  // goes back to the list.
  const next = place.next
    ? { href: `/lessons/${place.next.id}`, label: "Next lesson" }
    : { href: "/lessons", label: "Back to all lessons" };

  return (
    <>
      <section aria-labelledby="lesson-title" className="relative isolate shrink-0 py-4 text-center md:py-5">
        <HeroBackdrop />
        {/* Back to the list, at the top left of the hero. */}
        <Link
          href="/lessons"
          className="mb-2 inline-flex min-h-11 items-center gap-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover lg:absolute lg:top-4 lg:left-0 lg:mb-0"
        >
          {/* Arrow path data from Lucide (lucide.dev), ISC license. Decorative. */}
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
          >
            <path d="m12 19-7-7 7-7" />
            <path d="M19 12H5" />
          </svg>
          All lessons
        </Link>
        <div>
          <HeroPill>
            Lesson {place.card.number} of {place.total} · {place.card.groupTitle}
          </HeroPill>
        </div>
        <h1
          id="lesson-title"
          className="mt-3 animate-fade-up text-[2.25rem] leading-[1.1] font-semibold tracking-tight [animation-delay:80ms] md:text-[2.75rem]"
        >
          {/* Navy to green (both pass 4.5:1 on white), from the logo. */}
          <span className="bg-linear-to-r from-heading to-secondary bg-clip-text pb-1 text-transparent">
            {lesson.title}
          </span>
        </h1>
        {/* The student picks how many questions before the quiz starts, so
            this shows the range, e.g. "3–10 questions · about 3–6 min". */}
        <p className="mt-2 animate-fade-up text-muted [animation-delay:120ms]">
          <Range from={lengths.min} to={lengths.max} /> question{lengths.max === 1 ? "" : "s"}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          about <Range from={minutesToFinish(lengths.min)} to={minutesToFinish(lengths.max)} /> min
        </p>
      </section>

      {/* "relative": paints above the hero's glow, which reaches down behind it. */}
      <div className="relative animate-fade-up [animation-delay:160ms] lg:min-h-0 lg:flex-1">
        <LessonView
          lesson={lesson}
          rulePoints={ruleSentences(lesson.rule)}
          previous={place.previous}
          next={place.next}
          quizNext={next}
        />
      </div>
    </>
  );
}
