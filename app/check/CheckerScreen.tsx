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
    // From 1024px up the screen is exactly the window's height below the
    // header (--header-height in globals.css): the hero takes what it needs
    // and the card fills the rest, so the page never scrolls. On shorter
    // windows it stops shrinking at 40rem and the page scrolls a little.
    //
    // Once feedback is showing (the checker card has data-status="results"),
    // the hero folds away on wide screens and the card gets that space, so the
    // feedback and lessons need less scrolling. It comes back on "Edit my
    // writing". The heading stays in the page for screen readers.
    <div className="group/screen mx-auto flex w-full max-w-[1240px] flex-col px-4 pb-4 md:px-6 lg:h-[calc(100dvh-var(--header-height))] lg:min-h-[40rem]">
      <section
        aria-labelledby="hero-title"
        // On short windows (820px tall or less) the hero is more compact, so
        // the writing box keeps enough room.
        className="relative isolate shrink-0 py-6 text-center md:py-7 [@media(max-height:820px)]:py-4 lg:max-h-96 lg:transition-[max-height,padding,opacity] lg:duration-500 lg:ease-in-out lg:group-has-[[data-status=results]]/screen:max-h-0 lg:group-has-[[data-status=results]]/screen:overflow-hidden lg:group-has-[[data-status=results]]/screen:py-2 lg:group-has-[[data-status=results]]/screen:opacity-0"
      >
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

        {/* A rounded white pill with a flashing green "live" light in front,
            then a line like the reference's "A special tool for everyone
            typing [make this sound human] into a chatbot", with the phrase
            in its own small box. */}
        <p className="inline-flex animate-fade-up flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-divider bg-background px-4 py-1.5 text-muted shadow-sm">
          {/* The dot, with a ring that keeps growing and fading behind it
              (Tailwind's animate-ping). Decoration only. */}
          <span aria-hidden="true" className="relative flex size-2.5 shrink-0">
            <span className="absolute inset-0 animate-ping rounded-full bg-logo-green opacity-75" />
            <span className="relative size-2.5 rounded-full bg-logo-green" />
          </span>
          A writing coach for everyone who asks
          <span className="rounded-md border border-divider bg-surface px-2 font-mono text-base text-heading">
            is my English correct?
          </span>
        </p>
        <h1
          id="hero-title"
          // Weight 600 with slightly tight letters, like the reference headline.
          className="mt-4 animate-fade-up text-[2.25rem] leading-[1.1] font-semibold tracking-tight [animation-delay:80ms] md:text-5xl lg:text-[3.5rem] [@media(max-height:820px)]:mt-3 lg:[@media(max-height:820px)]:text-[2.75rem]"
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

      <div className="animate-fade-up [animation-delay:240ms] lg:min-h-0 lg:flex-1">
        <EssayChecker lessons={lessons} />
      </div>
    </div>
  );
}
