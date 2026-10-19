import type { Metadata } from "next";
import { getLessons } from "@/app/lessons/lesson";
import EssayChecker from "./EssayChecker";

export const metadata: Metadata = {
  title: "Check my essay - Wenova",
};

// Essay Checker. The page is one column up to 1024px wide, then two columns
// (writing left, feedback right). See design-system/wenova/pages/check.md.
export default function CheckPage() {
  // Lesson titles by id, e.g. { "past-simple": "Past Simple" }, for the rule
  // tags. Built here on the server, so the browser gets only the titles.
  const lessonTitles = Object.fromEntries(
    getLessons().map((lesson) => [lesson.id, lesson.title]),
  );

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-8 md:px-6 md:py-10 lg:max-w-[1120px]">
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">Check my essay</h1>
      <p className="mt-2 text-muted">Paste your essay and I&apos;ll show you what to fix.</p>
      <EssayChecker lessonTitles={lessonTitles} />
    </div>
  );
}
