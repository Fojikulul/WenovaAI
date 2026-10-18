import Link from "next/link";
import type { ReactNode } from "react";

// Icons: path data from Lucide (lucide.dev), ISC license. They are decorative,
// so screen readers skip them; the text next to each one says the same thing.
function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

function CheckIcon() {
  return (
    <Icon>
      <path d="M20 6 9 17l-5-5" />
    </Icon>
  );
}

function BookIcon() {
  return (
    <Icon>
      <path d="M12 7v14" />
      <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Icon>
  );
}

function ArrowRightIcon() {
  return (
    <Icon>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </Icon>
  );
}

// Home: two big choices. "Check my essay" is filled blue because it is the
// main feature; "Lessons" is a blue outline.
export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-16 md:px-6 md:py-24">
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
        Write better English
      </h1>
      <p className="mt-4 text-muted">Write in English and get simple, friendly help.</p>

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        <Link
          href="/check"
          className="flex flex-col gap-3 rounded-xl bg-primary p-6 text-on-primary transition-colors hover:bg-primary-hover"
        >
          <span className="flex items-center justify-between">
            <CheckIcon />
            <ArrowRightIcon />
          </span>
          <span className="font-heading text-xl font-semibold">Check my essay</span>
          <span>Paste your writing and see what to fix.</span>
        </Link>

        <Link
          href="/lessons"
          className="flex flex-col gap-3 rounded-xl border-2 border-primary bg-background p-6 text-primary transition-colors hover:bg-surface"
        >
          <span className="flex items-center justify-between">
            <BookIcon />
            <ArrowRightIcon />
          </span>
          <span className="font-heading text-xl font-semibold">Lessons</span>
          <span className="text-text">Short grammar lessons with practice.</span>
        </Link>
      </div>
    </div>
  );
}
