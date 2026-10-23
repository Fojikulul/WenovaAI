import Link from "next/link";

export default function LessonNotFound() {
  return (
    <div className="mx-auto w-full max-w-[720px] px-4 py-12 md:px-6 md:py-16">
      <h1 className="text-[1.75rem] leading-tight font-bold md:text-4xl">
        Lesson not found
      </h1>
      <p className="mt-4 text-muted">
        We couldn&apos;t find this lesson. The link may be wrong or old.
      </p>
      <Link
        href="/lessons"
        className="mt-8 inline-flex min-h-11 items-center gap-2 font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
      >
        {/* Arrow path data from Lucide (lucide.dev), ISC license. Decorative. */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>
        See all lessons
      </Link>
    </div>
  );
}
