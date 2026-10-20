import { getLessons } from "@/app/lessons/lesson";
import MistakeStickers from "@/components/MistakeStickers";
import EssayChecker from "./EssayChecker";

// The main screen, shown at / and at /check: a short hero, then the Essay
// Checker card. Layout follows design-system/wenova/pages/check.md.
export default function CheckerScreen() {
  // Each lesson's title and example by id, e.g. { "past-simple": { title:
  // "Past Simple", example: "I watched a movie last night." } }, for the rule
  // tags and the fix panel. Built here on the server, so the browser gets
  // only these two fields, not the whole lessons file.
  const lessons = Object.fromEntries(
    getLessons().map((lesson) => [lesson.id, { title: lesson.title, example: lesson.example }]),
  );

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-6 md:px-6">
      <section aria-labelledby="hero-title" className="relative isolate py-6 text-center md:py-8">
        {/* Behind the headline, across the full width of the screen: a
            faint grid and a soft glow, mostly the logo's green with a little
            blue. Decoration only. It reaches down behind the top of the card
            (which is white, so it covers it), and the mask fades it out
            toward the bottom and sides, so there is never a hard edge. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-0 left-1/2 -z-10 h-[calc(100%+8rem)] w-screen -translate-x-1/2 overflow-hidden [mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
        >
          <div className="hero-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_0%,black_25%,transparent_75%)]" />
          <div className="absolute -top-40 left-1/2 size-[22rem] -translate-x-1/2 rounded-full bg-logo-green/20 blur-3xl md:size-[38rem]" />
          <div className="absolute -top-24 left-[8%] size-56 rounded-full bg-primary/10 blur-3xl md:size-96" />
        </div>
        <MistakeStickers />

        <p className="inline-flex animate-fade-up items-center gap-2 rounded-full border border-divider bg-background px-3 py-1 text-muted">
          {/* A green "live" light: the dot, with a ring that keeps growing
              and fading behind it (Tailwind's animate-ping). Decoration only. */}
          <span aria-hidden="true" className="relative flex size-2.5 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-logo-green opacity-75" />
            <span className="relative size-2.5 rounded-full bg-logo-green" />
          </span>
          A writing coach for students learning English
        </p>
        <h1
          id="hero-title"
          className="mt-4 animate-fade-up text-[2.25rem] leading-[1.1] font-bold [animation-delay:80ms] md:text-5xl lg:text-[3.5rem]"
        >
          Write better English
          {/* Navy to green (both pass 4.5:1 on white), from the logo. */}
          <span className="block bg-linear-to-r from-heading to-secondary bg-clip-text pb-1 text-transparent">
            one fix at a time
          </span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl animate-fade-up text-muted [animation-delay:160ms]">
          Paste your essay, fix your mistakes, and practice the rules.
        </p>
      </section>

      <div className="animate-fade-up [animation-delay:240ms]">
        <EssayChecker lessons={lessons} />
      </div>
    </div>
  );
}
