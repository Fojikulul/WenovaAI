import type { Metadata } from "next";
import Link from "next/link";
import HeroBackdrop from "@/components/HeroBackdrop";
import { ExternalLinkIcon } from "@/components/icons";
import { primaryButton, secondaryButton, textLink } from "@/components/ui";
import Reveal from "./Reveal";

const DESCRIPTION =
  "Why we built Wenova: a patient writing coach for students learning English, made by students who learned it the hard way.";

export const metadata: Metadata = {
  title: "About us - Wenova",
  description: DESCRIPTION,
  openGraph: { title: "About Wenova", description: DESCRIPTION, type: "website", siteName: "Wenova AI" },
  twitter: { card: "summary", title: "About Wenova", description: DESCRIPTION },
};

const REPORT_URL =
  "https://www.postandcourier.com/education-lab/sc-native-language-state-tests-english/article_cac98f48-32b7-43e7-b78c-551e97fb735e.html";

const heading = "text-2xl leading-tight font-semibold tracking-tight md:text-3xl";

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 pb-16 md:px-6">
      <section aria-labelledby="about-title" className="relative isolate py-10 text-center md:py-14">
        <HeroBackdrop />
        <h1
          id="about-title"
          className="animate-fade-up text-[2.5rem] leading-[1.05] font-semibold tracking-tight md:text-[3.5rem]"
        >
          <span className="bg-linear-to-r from-heading to-secondary bg-clip-text pb-1 text-transparent">
            About Wenova
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-[34ch] animate-fade-up text-xl text-muted [animation-delay:100ms] md:text-2xl">
          Wenova will always answer you, patiently and kindly, as many times as you need.
        </p>
      </section>

      <div className="relative mx-auto flex max-w-[65ch] flex-col gap-12 text-lg leading-relaxed md:text-xl">
        <Reveal className="flex flex-col gap-4">
          <h2 className={heading}>Why we built it</h2>
          <p>None of us grew up speaking English. We learned it the hard way.</p>
          <div className="flex flex-col gap-4 [&>p]:border-l-4 [&>p]:border-logo-green/60 [&>p]:pl-4">
            <p>
              In second grade, Vincent asked other kids to play with him at recess, but he
              couldn&apos;t say the words right. Everyone thought he was speaking gibberish, so he
              sat alone next to a tree every day.
            </p>
            <p>
              When Vasyl first moved to the United States, he was mostly ignored. Between his life
              situation and not knowing English, he struggled, so he buried himself in coding,
              because a computer responds to you no matter what.
            </p>
            <p>
              Johnny didn&apos;t have time to struggle slowly. His immigrant parents needed him to
              speak for them at appointments and with paperwork, so he forced himself to adapt,
              studied English every extra hour he could, and grew stronger for them.
            </p>
          </div>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          <h2 className={heading}>Why it matters now</h2>
          <p>
            We are not the only ones.{" "}
            <a href={REPORT_URL} target="_blank" rel="noopener noreferrer" className={textLink}>
              A Post and Courier report
              <span className="ml-1 inline-block align-[-0.1em]">
                <ExternalLinkIcon size={16} />
              </span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>{" "}
            found that South Carolina had{" "}
            <strong className="text-heading">almost 77,000 English learners</strong> in 2024–25,{" "}
            <strong className="text-heading">up 35% since 2018</strong>, while total enrollment grew
            only 2%.
          </p>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          <h2 className={heading}>What makes Wenova different</h2>
          <p>
            Wenova is the patient coach we wished we had. It doesn&apos;t just fix your English. It
            shows you why, lets you try the fix yourself, and celebrates every step you get right.
            ESL students from our school&apos;s Multicultural Club tested it before we launched. We
            built it with help from AI tools, and we&apos;re open about how.
          </p>
        </Reveal>

        <Reveal className="overflow-hidden rounded-2xl border border-correct-border/40 bg-tag-bg shadow-sm">
          <div aria-hidden="true" className="h-1 bg-linear-to-r from-primary to-logo-green" />
          <div className="flex flex-col gap-4 p-6 md:p-8">
            <h2 className={heading}>Our promise</h2>
            <p className="text-xl leading-relaxed font-semibold text-heading md:text-2xl">
              Here, you will never be ignored, never be made to feel small, and never have to figure
              out English alone. And your writing is never saved on our servers.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/" className={primaryButton}>
            Check my essay
          </Link>
          <Link href="/lessons" className={secondaryButton}>
            Start a lesson
          </Link>
        </div>
      </div>
    </div>
  );
}
