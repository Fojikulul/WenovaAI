import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Quiz from "@/components/Quiz";
import { getLesson, getLessonCards, getLessons } from "../lesson";

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
    <div className="mx-auto w-full max-w-[720px] px-4 pb-12 md:px-6">
      <Suspense fallback={<p className="py-12 text-center text-muted">Loading lesson…</p>}>
        <LessonContent params={params} />
      </Suspense>
    </div>
  );
}

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) {
    notFound();
  }

  const cards = getLessonCards();
  const after = cards[cards.findIndex((card) => card.id === id) + 1];
  const next = after
    ? { href: `/lessons/${after.id}`, label: "Next lesson" }
    : { href: "/lessons", label: "Back to all lessons" };

  return (
    <article aria-labelledby="lesson-title" className="py-8">
      <Link
        href="/lessons"
        className="inline-flex min-h-11 items-center font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
      >
        All lessons
      </Link>
      <h1
        id="lesson-title"
        className="mt-4 text-[2.25rem] leading-[1.1] font-semibold tracking-tight md:text-[2.75rem]"
      >
        {lesson.title}
      </h1>

      <h2 className="mt-8 text-xl font-semibold">The rule</h2>
      <p className="mt-2 max-w-[65ch]">{lesson.rule}</p>

      <h2 className="mt-6 text-xl font-semibold">Example</h2>
      <p className="mt-2 rounded-lg bg-surface px-4 py-3 text-lg">{lesson.example}</p>

      <h2 className="mt-6 text-xl font-semibold">Common mistake</h2>
      <div className="mt-2 flex flex-col gap-3">
        <p className="rounded-lg bg-mistake-bg px-4 py-3 text-lg">
          <span className="font-bold text-mistake-text">Wrong: </span>
          {lesson.mistake.wrong}
        </p>
        <p className="rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3 text-lg">
          <span className="font-bold text-correct-text">Right: </span>
          {lesson.mistake.right}
        </p>
      </div>

      <h2 id="practice-title" className="mt-8 text-xl font-semibold">
        Practice
      </h2>
      <div className="mt-4">
        <Quiz key={lesson.id} questions={lesson.practice} next={next} />
      </div>
    </article>
  );
}
