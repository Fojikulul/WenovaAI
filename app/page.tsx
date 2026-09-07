import Link from "next/link";

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-16 md:px-6 md:py-24">
      <h1 className="max-w-3xl text-[2.5rem] leading-[1.1] font-semibold tracking-tight md:text-5xl">
        Write better English, one fix at a time
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Wenova is a friendly writing coach for students learning English. Paste your writing, see
        your mistakes, and learn the rule behind each one.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link
          href="/check"
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover"
        >
          Check my essay
        </Link>
        <Link
          href="/lessons"
          className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-primary bg-background px-[22px] py-[10px] font-bold text-primary transition-colors hover:bg-surface"
        >
          Browse lessons
        </Link>
      </div>
    </div>
  );
}
