"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { CheckIcon } from "./icons";

const LINE_1 = "Write better English";
const LINE_2 = "one fix at a time";
const MISSING = 17;
const TYPO_LENGTH = LINE_1.length - 1;
const WORD_START = 13;
const SKIP_AFTER = 1400;

type Frame = {
  started: boolean;
  typed1: number;
  typed2: number;
  caret: { line: 1 | 2; at: number } | null;
  highlight: boolean;
  fixed: boolean;
  check: "hidden" | "pop" | "shown";
  blink: boolean;
  caretOut: boolean;
};

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

const FINISHED: Frame = {
  ...START,
  started: true,
  typed1: TYPO_LENGTH,
  typed2: LINE_2.length,
  caret: null,
  fixed: true,
  check: "shown",
};

function timeline(): [number, Partial<Frame>][] {
  const steps: [number, Partial<Frame>][] = [[0, { started: true }]];
  for (let i = 1; i <= TYPO_LENGTH; i++) {
    steps.push([150 + (i - 1) * 42, { typed1: i, caret: { line: 1, at: i } }]);
  }
  steps.push(
    [1050, { highlight: true }],
    [1250, { caret: { line: 1, at: MISSING + 1 } }],
    [1350, { caret: { line: 1, at: MISSING } }],
    [1450, { fixed: true, highlight: false }],
    [1600, { check: "pop", caret: { line: 2, at: 0 } }],
  );
  for (let i = 1; i <= LINE_2.length; i++) {
    steps.push([1750 + (i - 1) * 41, { typed2: i, caret: { line: 2, at: i } }]);
  }
  steps.push(
    [2450, { blink: true }],
    [3050, { caretOut: true }],
    [3300, { caret: null }],
  );
  return steps;
}

export default function HeroHeadline() {
  const reduce = useReducedMotion();
  const [frame, setFrame] = useState(START);

  useEffect(() => {
    if (reduce) return;
    const firstPaint = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? 0;
    const late = performance.now() - firstPaint > SKIP_AFTER;
    const steps: [number, Partial<Frame>][] = late ? [[0, FINISHED]] : timeline();
    const timers = steps.map(([time, change]) =>
      setTimeout(() => setFrame((current) => ({ ...current, ...change })), time),
    );
    return () => timers.forEach(clearTimeout);
  }, [reduce]);

  const waiting = `hero-wait opacity-0 motion-reduce:opacity-100 ${frame.started ? "" : "hero-fallback"}`;

  const caretAt = (line: 1 | 2, at: number) =>
    frame.caret?.line === line && frame.caret.at === at ? (
      <Caret key="caret" line={line} started={frame.started} blink={frame.blink} out={frame.caretOut} />
    ) : null;

  const letter1 = (k: number) => {
    if (k === MISSING) {
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
    <div className="relative mx-auto mb-3 w-fit max-w-full [@media(max-height:820px)]:mb-6">
      <div
        aria-hidden="true"
        className="hero-paper pointer-events-none absolute -inset-x-4 -top-5 -bottom-5 -z-5 animate-fade-up rounded-2xl border border-paper-edge bg-paper/85 shadow-sm [animation-delay:80ms] md:-inset-x-7 lg:-inset-x-9"
      >
        <span className="absolute bottom-0 left-0 size-6 bg-paper-fold [clip-path:polygon(0_0,100%_0,100%_100%)]" />
      </div>

      <h1
        id="hero-title"
        className="mt-10 text-[2rem] min-[400px]:text-[2.25rem] leading-[1.1] font-semibold tracking-tight text-balance md:text-5xl lg:text-[3.5rem] lg:[@media(max-height:820px)]:text-[2.75rem]"
      >
        {/* One string: Chrome drops a lone space between two text parts here. */}
        <span className="sr-only">{`${LINE_1} ${LINE_2}`}</span>
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
          <span className="whitespace-nowrap">
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
          <span className="block bg-linear-to-r from-heading to-secondary bg-clip-text pb-1 text-transparent">
            {range(0, LINE_2.length, (k) => [
              caretAt(2, k),
              <span key={k} className={k < frame.typed2 ? undefined : waiting}>
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

function Caret({ line, started, blink, out }: { line: 1 | 2; started: boolean; blink: boolean; out: boolean }) {
  const bar = "absolute top-[0.08em] bottom-[0.02em] -left-[0.035em] w-[0.07em] rounded-full bg-current";
  return (
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

function FixedCheck({ state, waiting }: { state: Frame["check"]; waiting: string }) {
  const look =
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
