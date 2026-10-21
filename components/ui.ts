// Tailwind classes shared by the account pages (login, settings, progress),
// matching the Essay Checker's buttons and the lesson cards.

export const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-primary";

export const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-[22px] py-[10px] font-bold text-primary transition-colors hover:bg-surface";

// For actions that delete data: same shape, in the mistake red.
export const dangerButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-mistake-line bg-background px-[22px] py-[10px] font-bold text-mistake-text transition-colors hover:bg-mistake-bg";

export const textLink =
  "font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover";

// Text inputs and selects: 48px tall, 3:1 border, 16px+ text.
export const inputClass =
  "min-h-12 w-full rounded-lg border border-border bg-background px-3 text-lg text-text placeholder:text-muted aria-invalid:border-mistake-line";

export const labelClass = "font-bold text-heading";

// A card like the checker's: border, rounded corners, small shadow, and the
// blue-to-green line along the top.
export const card =
  "overflow-hidden rounded-2xl border border-divider bg-background shadow-sm";
