import Link from "next/link";
import type { ReactNode } from "react";
import HeroBackdrop from "./HeroBackdrop";
import { card, primaryButton, secondaryButton } from "./ui";

export function AccountPage({
  title,
  intro,
  width = "wide",
  children,
}: {
  title: string;
  intro?: ReactNode;
  width?: "narrow" | "wide";
  children: ReactNode;
}) {
  return (
    <div
      className={`mx-auto w-full px-4 pb-12 md:px-6 ${width === "narrow" ? "max-w-[560px]" : "max-w-[1240px]"}`}
    >
      <section aria-labelledby="page-title" className="relative isolate py-8 text-center md:py-10">
        <HeroBackdrop />
        <h1
          id="page-title"
          className="animate-fade-up text-[2.25rem] leading-[1.1] font-semibold tracking-tight md:text-[2.75rem]"
        >
          <span className="bg-linear-to-r from-heading to-secondary bg-clip-text pb-1 text-transparent">
            {title}
          </span>
        </h1>
        {intro && <p className="mt-3 animate-fade-up text-muted [animation-delay:80ms]">{intro}</p>}
      </section>
      {/* "relative" keeps this above the hero's glow. */}
      <div className="relative animate-fade-up [animation-delay:120ms]">{children}</div>
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`${card} ${className}`}>
      <div aria-hidden="true" className="h-1 bg-linear-to-r from-primary to-logo-green" />
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

export function SignInPrompt({ next, reason }: { next: string; reason: string }) {
  return (
    <Card className="mx-auto max-w-[560px] text-center">
      <h2 className="text-xl font-semibold">Sign in to see this page</h2>
      <p className="mt-2">{reason}</p>
      <p className="mt-2 text-muted">The Essay Checker and Lessons work without an account.</p>
      <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href={`/login?next=${encodeURIComponent(next)}`} className={primaryButton}>
          Sign in
        </Link>
        <Link href={`/login?mode=signup&next=${encodeURIComponent(next)}`} className={secondaryButton}>
          Create an account
        </Link>
      </div>
    </Card>
  );
}

export function NotConfigured() {
  return (
    <Card className="mx-auto max-w-[560px] text-center">
      <h2 className="text-xl font-semibold">Accounts aren&apos;t set up yet</h2>
      <p className="mt-2">
        This copy of Wenova has no Supabase project connected, so sign-in and saved progress are
        off. The Essay Checker and Lessons work as usual.
      </p>
      <p className="mt-2 text-muted">Setup steps: docs/SUPABASE_SETUP.md</p>
    </Card>
  );
}
