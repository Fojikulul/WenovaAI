import type { Metadata } from "next";
import { getLessons } from "@/app/lessons/lesson";
import EssayChecker from "./EssayChecker";

export const metadata: Metadata = {
  title: "Check my essay - Wenova",
};

export default function CheckPage() {
  const lessons = Object.fromEntries(
    getLessons().map((lesson) => [lesson.id, { title: lesson.title, example: lesson.example }]),
  );

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 py-8 md:px-6 md:py-10">
      <h1 className="text-[2.25rem] leading-[1.1] font-semibold tracking-tight md:text-[2.75rem]">
        Check my essay
      </h1>
      <p className="mt-3 text-muted">Paste your essay, fix your mistakes, and practice the rules.</p>
      <div className="mt-6">
        <EssayChecker lessons={lessons} />
      </div>
    </div>
  );
}
