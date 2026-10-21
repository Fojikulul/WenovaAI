import type { ReactNode } from "react";

// The small rounded white pill above a hero headline, with a flashing green
// "live" light in front (the dot, with a ring that keeps growing and fading
// behind it: Tailwind's animate-ping). The light is decoration only.
export default function HeroPill({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex animate-fade-up flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-divider bg-background px-4 py-1.5 text-muted shadow-sm">
      <span aria-hidden="true" className="relative flex size-2.5 shrink-0">
        <span className="absolute inset-0 animate-ping rounded-full bg-logo-green opacity-75" />
        <span className="relative size-2.5 rounded-full bg-logo-green" />
      </span>
      {children}
    </p>
  );
}
