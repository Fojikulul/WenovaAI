import { getLessons } from "@/app/lessons/lesson";
import HeroBackdrop from "@/components/HeroBackdrop";
import HeroHeadline from "@/components/HeroHeadline";
import HeroPill from "@/components/HeroPill";
import MistakeStickers from "@/components/MistakeStickers";
import EssayChecker from "./EssayChecker";

export default function CheckerScreen() {
  const lessons = Object.fromEntries(
    getLessons().map((lesson) => [lesson.id, { title: lesson.title, example: lesson.example }]),
  );

  return (
    <div className="group/screen mx-auto flex w-full max-w-[1240px] flex-col px-4 pb-4 md:px-6 lg:h-[calc(100dvh-var(--header-height)-var(--footer-height))] lg:min-h-[40rem] lg:has-[[data-status=results]]:h-auto">
      <section
        aria-labelledby="hero-title"
        className="relative isolate shrink-0 py-6 text-center md:py-7 [@media(max-height:820px)]:py-4"
      >
        <HeroBackdrop />
        <MistakeStickers />

        <HeroPill>
          A writing coach for everyone who asks
          <span className="rounded-md border border-divider bg-surface px-2 font-mono text-base text-heading">
            is my English correct?
          </span>
        </HeroPill>
        <HeroHeadline />
      </section>

      {/* "relative" keeps this above the hero's glow. */}
      <div className="relative animate-fade-up [animation-delay:240ms] lg:min-h-0 lg:flex-1 lg:group-has-[[data-status=results]]/screen:h-[calc(100dvh-var(--header-height)-1.5rem)] lg:group-has-[[data-status=results]]/screen:flex-none">
        <EssayChecker lessons={lessons} />
      </div>
    </div>
  );
}
