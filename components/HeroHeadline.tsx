"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon } from "./icons";

// The hero's headline and the line under it, on a sheet of paper. When the
// page loads, the headline types itself once like a mini demo of the
// checker: "Write better Englsh" gets the checker's mistake highlight, the
// caret goes back and fixes it to "English", a green check pops in, then
// "one fix at a time" is typed (about 3.3s). The line under it shows from the
// start, so the page counts as loaded right away.
//
// Nothing below it ever moves: every letter and the check are in the page
// from the start, just invisible until they appear, and the caret takes no
// space. Screen readers read the real headline (the sr-only span).
//
// Before JavaScript starts, a CSS caret blinks at the start of line 1. If
// the typing hasn't started 1.5s after the page appears (a slow phone), CSS
// shows the finished headline instead, and the typing is skipped (see
// .hero-fallback in globals.css). With "reduce motion" on, or without
// JavaScript, the finished headline shows at once.
//
// Owner: Johnny. Placed in app/check/CheckerScreen.tsx (Vasyl OK'd it).

const LINE_1 = "Write better English";
const LINE_2 = "one fix at a time";
// The typo leaves out the "i" of "English" (index 17 in LINE_1), so it
// reads "Write better Englsh" (19 letters).
const MISSING = 17;
const TYPO_LENGTH = LINE_1.length - 1;
// Where "English" starts in LINE_1.
const WORD_START = 13;
// If JavaScript starts later than this after the first paint, skip the
// typing: the CSS fallback shows the finished headline at 1.5s anyway.
const SKIP_AFTER = 1400;

// How far the animation has got. The caret is after `at` letters of its
// line, counted in the typo for line 1 (so 17 is between "l" and "s").
type Frame = {
  started: boolean; // JavaScript has taken over from the CSS caret and fallback
  typed1: number; // letters of "Write better Englsh" typed
  typed2: number; // letters of "one fix at a time" typed
  caret: { line: 1 | 2; at: number } | null;
  highlight: boolean; // "Englsh" has the mistake highlight
  fixed: boolean; // the "i" is in
  check: "hidden" | "pop" | "shown"; // the green check after "English"
  blink: boolean; // the caret blinks (after typing)
  caretOut: boolean; // the caret fades out
};

// Server HTML and the first frame in the browser: nothing typed yet, and the
// CSS caret blinks at the start of line 1. (With "reduce motion" on, the
// motion-reduce: classes make this same frame look finished.)
const START: Frame = {
  started: false,
  typed1: 0,
  typed2: 0,
  caret: { line: 1, at: 0 },
  highlight: false,
  fixed: false,
  check: "hidden",
  blink: false,
  caretOut: false,
};

// The finished headline, when the typing is skipped.
const FINISHED: Frame = {
  ...START,
  started: true,
  typed1: TYPO_LENGTH,
  typed2: LINE_2.length,
  caret: null,
  fixed: true,
  check: "shown",
};

// The timeline: at each time (ms after JavaScript starts), these parts of
// the frame change.
function timeline(): [number, Partial<Frame>][] {
  const steps: [number, Partial<Frame>][] = [[0, { started: true }]];
  // Type "Write better Englsh", 42ms a letter, from 0.15s to about 0.9s.
  for (let i = 1; i <= TYPO_LENGTH; i++) {
    steps.push([150 + (i - 1) * 42, { typed1: i, caret: { line: 1, at: i } }]);
  }
  steps.push(
    // A short pause, then the mistake highlight, like in the checker.
    [1050, { highlight: true }],
    // The caret steps back two letters, to between "l" and "s".
    [1250, { caret: { line: 1, at: MISSING + 1 } }],
    [1350, { caret: { line: 1, at: MISSING } }],
    // The "i" goes in (just before the caret) and the highlight fades out.
    [1450, { fixed: true, highlight: false }],
    // The green check pops in; the caret jumps to line 2.
    [1600, { check: "pop", caret: { line: 2, at: 0 } }],
  );
  // Type "one fix at a time", 41ms a letter, from 1.75s to about 2.4s.
  for (let i = 1; i <= LINE_2.length; i++) {
    steps.push([1750 + (i - 1) * 41, { typed2: i, caret: { line: 2, at: i } }]);
  }
  steps.push(
    [2450, { blink: true }], // blinks twice
    [3050, { caretOut: true }], // the caret fades out
    [3300, { caret: null }],
  );
  return steps;
}

// The color of letter `k` of line 2: the heading color at the start, fully
// green by the end of "fix" (about 42% of the line), then green to the end,
// so the green part stands out. A gradient across the line (bg-clip-text)
// can't be used: it paints through letters that aren't typed yet. Both end
// colors pass 4.5:1, so every mix between them does too.
const FULL_GREEN_AT = 0.42;
function fadeColor(k: number) {
  const green = Math.min(1, (k + 0.5) / LINE_2.length / FULL_GREEN_AT);
  return `color-mix(in oklab, var(--secondary) ${Math.round(green * 100)}%, var(--heading))`;
}

export default function HeroHeadline() {
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState(START);

  useEffect(() => {
    if (reduce) return;
    // How long the page has been on screen (from its first paint).
    const firstPaint = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    const late = performance.now() - firstPaint > SKIP_AFTER;
    const steps: [number, Partial<Frame>][] = late ? [[0, FINISHED]] : timeline();
    const timers = steps.map(([time, change]) =>
      setTimeout(() => setFrame((current) => ({ ...current, ...change })), time),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  // Classes for something not typed yet. "motion-reduce:" shows it anyway
  // with "reduce motion" on; "hero-wait" is for the <noscript> rule below;
  // "hero-fallback" (until JavaScript starts) shows it after 1.5s.
  const waiting = `hero-wait opacity-0 motion-reduce:opacity-100 ${frame.started ? "" : "hero-fallback"}`;

  // The caret, when it is at position `at` of `line`.
  const caretAt = (line: 1 | 2, at: number) =>
    frame.caret?.line === line && frame.caret.at === at ? (
      <Caret key="caret" line={line} started={frame.started} blink={frame.blink} out={frame.caretOut} />
    ) : null;

  // Line 1, letter by letter. Index `k` is in LINE_1; the caret's position
  // is counted in the typo, so after the missing "i" it is one less.
  const letter1 = (k: number) => {
    if (k === MISSING) {
      // The "i" isn't in the line until the fix, so "Englsh" has no gap.
      // Before JavaScript starts it has no size instead (CSS can bring that
      // back for the fallback); after, it is left out completely, so it
      // counts as appearing, not as moving (layout shift).
      const hidden = frame.started
        ? "hidden"
        : "hero-wait-i hero-fallback-i text-[0px] motion-reduce:text-[1em]";
      return (
        <span key={k} className={frame.fixed ? undefined : hidden}>
          {LINE_1[k]}
        </span>
      );
    }
    const typoIndex = k < MISSING ? k : k - 1;
    return [
      caretAt(1, typoIndex),
      <span key={k} className={typoIndex < frame.typed1 ? undefined : waiting}>
        {LINE_1[k]}
      </span>,
    ];
  };

  const range = (from: number, to: number, render: (k: number) => ReactNode) =>
    Array.from({ length: to - from }, (_, i) => render(from + i));

  return (
    <div className="relative mx-auto w-fit max-w-full">
      {/* The sheet of paper: behind the text, a little wider than it. Its
          size comes from the finished headline, so it never changes while the
          text types. The top and bottom insets differ so the letters look
          centered (the headline's line box has empty space above the
          capitals). See .hero-paper in globals.css. */}
      <div
        aria-hidden="true"
        className="hero-paper pointer-events-none absolute -inset-x-4 -top-5 -bottom-5 -z-5 animate-fade-up rounded-2xl border border-paper-edge bg-paper/85 shadow-sm [animation-delay:80ms] md:-inset-x-7 lg:-inset-x-9"
      >
        {/* The folded corner, like the logo's paper. */}
        <span className="absolute bottom-0 left-0 size-6 bg-paper-fold [clip-path:polygon(0_0,100%_0,100%_100%)]" />
      </div>

      <h1
        id="hero-title"
        // Weight 600 with slightly tight letters, like the reference headline.
        // A little smaller on phones under 400px, so "Write better English"
        // and its check still fit on one line.
        className="mt-8 text-[2rem] min-[400px]:text-[2.25rem] leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl lg:text-[3.5rem] [@media(max-height:820px)]:mt-7 lg:[@media(max-height:820px)]:text-[2.75rem]"
      >
        {/* One string: Chrome drops a lone space between two text parts here. */}
        <span className="sr-only">{`${LINE_1} ${LINE_2}`}</span>
        {/* Two layers in one grid cell: an invisible copy of the finished
            headline sets the size (so the paper never grows while the "i" is
            added), and the typing runs on top of it. */}
        <span aria-hidden="true" className="grid">
          <span className="invisible [grid-area:1/1]">
            <span className="whitespace-nowrap">
              {LINE_1}
              <FixedCheck state="shown" waiting="" />
            </span>
            <span className="block pb-1">{LINE_2}</span>
          </span>
          <span className="[grid-area:1/1]">
          {range(0, WORD_START, letter1)}
          {/* The word and its check never go onto different lines. */}
          <span className="whitespace-nowrap">
            {/* "Englsh": the checker's mistake highlight (HighlightedText),
                which fades out when the word is fixed. On the white paper the
                light theme's pink is too faint, so the background is stronger
                here; the dark theme uses the checker's color. */}
            <span
              className={`rounded-[0.12em] underline decoration-wavy decoration-2 underline-offset-[0.14em] transition-colors duration-150 [text-decoration-skip-ink:none] md:decoration-[3px] ${
                frame.highlight
                  ? "bg-mistake-line/20 text-heading decoration-mistake-line [[data-theme=dark]_&]:bg-mistake-bg"
                  : "decoration-transparent"
              }`}
            >
              {range(WORD_START, LINE_1.length, letter1)}
            </span>
            {caretAt(1, TYPO_LENGTH)}
            <FixedCheck state={frame.check} waiting={waiting} />
          </span>
          {/* Line 2 fades from the heading color into green, letter by letter
              (see fadeColor), so letters not typed yet still stay hidden. */}
          <span className="block pb-1">
            {range(0, LINE_2.length, (k) => [
              caretAt(2, k),
              <span
                key={k}
                className={k < frame.typed2 ? undefined : waiting}
                style={{ color: fadeColor(k) }}
              >
                {LINE_2[k]}
              </span>,
            ])}
            {caretAt(2, LINE_2.length)}
          </span>
          </span>
        </span>
      </h1>

      <p className="mx-auto mt-3 max-w-xl animate-fade-up text-muted [animation-delay:160ms]">
        Paste your essay, fix your mistakes, and practice the rules.
      </p>

      {/* Without JavaScript nothing would type, so show the finished text. */}
      <noscript>
        <style>
          {".hero-wait{opacity:1!important}.hero-wait-i{font-size:1em!important}.hero-caret-wait{display:none!important}"}
        </style>
      </noscript>
    </div>
  );
}

// The typing caret: a thin bar in the text color. Its span has no width and
// isn't a block, so it never moves the letters or changes where lines wrap.
// Until JavaScript starts it blinks with CSS (.hero-caret-wait).
function Caret({ line, started, blink, out }: { line: 1 | 2; started: boolean; blink: boolean; out: boolean }) {
  const bar = "absolute top-[0.08em] bottom-[0.02em] -left-[0.035em] w-[0.07em] rounded-full bg-current";
  return (
    // On line 2 the caret is green, like the end of the line.
    <span className={`relative ${line === 2 ? "text-secondary" : ""}`}>
      {started ? (
        <motion.span
          className={bar}
          initial={false}
          animate={{ opacity: out ? 0 : blink ? [1, 0, 1, 0, 1] : 1 }}
          transition={out ? { duration: 0.2 } : blink ? { duration: 0.6, ease: "linear" } : { duration: 0 }}
        />
      ) : (
        <span className={`${bar} hero-caret-wait motion-reduce:hidden`} />
      )}
    </span>
  );
}

// The green check after "English". Its space is kept from the start (it is
// just invisible), so it never pushes the text when it appears. It pops in
// during the typing; when the typing is skipped it is simply there.
function FixedCheck({ state, waiting }: { state: Frame["check"]; waiting: string }) {
  const look =
    // inline-block (no text inside) sits its bottom on the baseline, so the
    // 0.66em circle is centered at about 0.35em: the middle of the capitals.
    "relative ml-[0.14em] inline-block size-[0.66em] rounded-full bg-correct-bg align-[0.02em] text-correct-text [&>svg]:absolute [&>svg]:inset-0 [&>svg]:m-auto [&>svg]:size-[70%]";
  if (state === "pop") {
    return (
      <motion.span
        className={look}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <CheckIcon />
      </motion.span>
    );
  }
  return (
    <span className={state === "shown" ? look : `${look} ${waiting}`}>
      <CheckIcon />
    </span>
  );
}
