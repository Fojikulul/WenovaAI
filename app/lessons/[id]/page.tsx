import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import HeroBackdrop from "@/components/HeroBackdrop";
import HeroPill from "@/components/HeroPill";
import { DifficultyBadge } from "@/components/LessonBadges";
import { lessonDifficulty } from "@/lib/learning";
import { getLesson, getLessonPlace, getLessons, ruleSentences } from "../lesson";
import { getQuizLengths } from "../quiz-lengths";
import LessonView from "./LessonView";

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

// Cache Components: an unknown lesson id is only known on a visit, so params are read inside <Suspense>.
export default function LessonPage({ params }: PageProps<"/lessons/[id]">) {
  return (
    <div className="mx-auto flex w-full max-w-[1240px] flex-col px-4 pb-4 md:px-6 lg:h-[calc(100dvh-var(--header-height))] lg:min-h-[40rem]">
      <Suspense fallback={<p className="py-12 text-center text-muted">Loading lesson…</p>}>
        <LessonContent params={params} />
      </Suspense>
    </div>
  );
}

function minutesToFinish(questionCount: number) {
  return Math.ceil(1 + questionCount * 0.5);
}

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
  const next = place.next
    ? { href: `/lessons/${place.next.id}`, label: "Next lesson" }
    : { href: "/lessons", label: "Back to all lessons" };

  return (
    <>
      <section aria-labelledby="lesson-title" className="relative isolate shrink-0 py-4 text-center md:py-5">
        <HeroBackdrop />
        <Link
          href="/lessons"
          className="mb-2 inline-flex min-h-11 items-center gap-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover lg:absolute lg:top-4 lg:left-0 lg:mb-0"
        >
          {/* Icon paths from Lucide (lucide.dev), ISC license. */}
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
          <span className="bg-linear-to-r from-heading to-secondary bg-clip-text pb-1 text-transparent">
            {lesson.title}
          </span>
        </h1>
        <p className="mt-2 flex animate-fade-up flex-wrap items-center justify-center gap-x-2 gap-y-1 text-muted [animation-delay:120ms]">
          <DifficultyBadge difficulty={lessonDifficulty(lesson.id)} />
          <span>
          <Range from={lengths.min} to={lengths.max} /> question{lengths.max === 1 ? "" : "s"}
          <span aria-hidden="true"> · </span>
          <span className="sr-only">, </span>
          about <Range from={minutesToFinish(lengths.min)} to={minutesToFinish(lengths.max)} /> min
          </span>
        </p>
      </section>

      {/* "relative" keeps this above the hero's glow. */}
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
