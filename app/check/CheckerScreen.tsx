import { getLessons } from "@/app/lessons/lesson";
import HeroBackdrop from "@/components/HeroBackdrop";
import HeroHeadline from "@/components/HeroHeadline";
import HeroPill from "@/components/HeroPill";
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
    // From 1024px up the screen is exactly the window's height below the
    // header (--header-height in globals.css): the hero takes what it needs
    // and the card fills the rest, so the page never scrolls. On shorter
    // windows it stops shrinking at 40rem and the page scrolls a little.
    //
    // Once feedback is showing (the checker card has data-status="results"),
    // from 1024px up the card becomes the window's full height and the page
    // scrolls down to it (EssayChecker does the scrolling). The hero stays
    // above it, so the student can always scroll back up.
    <div className="group/screen mx-auto flex w-full max-w-[1240px] flex-col px-4 pb-4 md:px-6 lg:h-[calc(100dvh-var(--header-height)-var(--footer-height))] lg:min-h-[40rem] lg:has-[[data-status=results]]:h-auto">
      <section
        aria-labelledby="hero-title"
        // On short windows (820px tall or less) the hero is more compact, so
        // the writing box keeps enough room.
        className="relative isolate shrink-0 py-6 text-center md:py-7 [@media(max-height:820px)]:py-4"
      >
        <HeroBackdrop />
        <MistakeStickers />

        {/* Like the reference's "A special tool for everyone typing [make this
            sound human] into a chatbot", with the phrase in its own box. */}
        <HeroPill>
          A writing coach for everyone who asks
          <span className="rounded-md border border-divider bg-surface px-2 font-mono text-base text-heading">
            is my English correct?
          </span>
        </HeroPill>
        {/* The headline and the line under it, typed out once on a sheet of
            paper (a mini demo of the checker). */}
        <HeroHeadline />
      </section>

      {/* "relative": paints above the hero's glow, which reaches down behind it. */}
      <div className="relative animate-fade-up [animation-delay:240ms] lg:min-h-0 lg:flex-1 lg:group-has-[[data-status=results]]/screen:h-[calc(100dvh-var(--header-height)-1.5rem)] lg:group-has-[[data-status=results]]/screen:flex-none">
        <EssayChecker lessons={lessons} />
      </div>
    </div>
  );
}
