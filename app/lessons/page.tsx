import type { Metadata } from "next";
import HeroBackdrop from "@/components/HeroBackdrop";
import { getLessonCards, getLessonGroups } from "./lesson";
import LessonsBrowser from "./LessonsBrowser";

export const metadata: Metadata = {
  title: "Lessons - Wenova",
};

// Lesson list, in the style of melies.co/ai-tools: a big left-aligned
// headline, then a toolbar (search, filter pills, "Pick one for me") and the
// lessons in sections.
export default function LessonsPage() {
  const cards = getLessonCards();
  const groups = getLessonGroups().map((group) => ({
    id: group.id,
    title: group.title,
    count: group.lessons.length,
  }));

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-12 md:px-6">
      <section aria-labelledby="lessons-title" className="relative isolate py-8 md:py-10">
        <HeroBackdrop />
        <h1
          id="lessons-title"
          className="max-w-3xl animate-fade-up text-[2.25rem] leading-[1.05] font-semibold tracking-tight md:text-[3.25rem]"
        >
          Grammar lessons, from the first rule{" "}
          {/* Navy to green (both pass 4.5:1 on white), from the logo. */}
          <span className="bg-linear-to-r from-heading to-secondary bg-clip-text pb-1 text-transparent">
            to the final quiz
          </span>
        </h1>
        <p className="mt-4 max-w-2xl animate-fade-up text-lg text-muted [animation-delay:100ms]">
          Search {cards.length} short lessons. Each one has the rule, an example, a common mistake,
          and a quick quiz.
        </p>
      </section>

      <div className="animate-fade-up [animation-delay:180ms]">
        <LessonsBrowser cards={cards} groups={groups} />
      </div>
    </div>
  );
}
