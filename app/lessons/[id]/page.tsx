import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getLesson, getLessonPlace, getLessons, ruleSentences } from "../lesson";
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
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-12 md:px-6">
      <Suspense fallback={<p className="py-12 text-center text-muted">Loading lesson…</p>}>
        <LessonContent params={params} />
      </Suspense>
    </div>
  );
}

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLesson(id);
  const place = getLessonPlace(id);
  if (!lesson || !place) {
    notFound();
  }

  const next = place.next
    ? { href: `/lessons/${place.next.id}`, label: "Next lesson" }
    : { href: "/lessons", label: "Back to all lessons" };

  return (
    <>
      <section aria-labelledby="lesson-title" className="py-6 md:py-8">
        <Link
          href="/lessons"
          className="inline-flex min-h-11 items-center gap-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
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
        <p className="mt-4 text-muted">
          Lesson {place.card.number} of {place.total} · {place.card.groupTitle}
        </p>
        <h1
          id="lesson-title"
          className="mt-1 text-[2.25rem] leading-[1.1] font-semibold tracking-tight md:text-[2.75rem]"
        >
          {lesson.title}
        </h1>
        <p className="mt-2 text-muted">
          {lesson.practice.length} question{lesson.practice.length === 1 ? "" : "s"}
        </p>
      </section>

      <LessonView
        lesson={lesson}
        rulePoints={ruleSentences(lesson.rule)}
        previous={place.previous}
        next={place.next}
        quizNext={next}
      />
    </>
  );
}
