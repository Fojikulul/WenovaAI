import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import Quiz from "@/components/Quiz";
import { getLesson, getLessons } from "../lesson";

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

async function LessonContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) {
    notFound();
  }

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

      <h1 className="mt-6 text-[1.75rem] leading-tight font-bold md:text-4xl">
        {lesson.title}
      </h1>

      {/* Rule card: the rule, one example, and a common mistake fixed. */}
      <section
        aria-labelledby="rule-title"
        className="mt-8 rounded-xl border border-divider bg-background p-6"
      >
        <h2 id="rule-title" className="text-[1.375rem] leading-snug font-semibold md:text-[1.75rem]">
          The rule
        </h2>
        <p className="mt-3">{lesson.rule}</p>

        <h3 className="mt-8 text-lg font-semibold md:text-xl">Example</h3>
        <p className="mt-2 rounded-lg bg-surface px-4 py-3 text-lg">{lesson.example}</p>

        <h3 className="mt-8 text-lg font-semibold md:text-xl">Common mistake</h3>
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
        <Quiz key={lesson.id} questions={lesson.practice} />
      </section>
    </>
  );
}
