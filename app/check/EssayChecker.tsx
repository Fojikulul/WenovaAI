"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import GradeCard from "@/components/GradeCard";
import HighlightedText, { locateMistakes, withFixes } from "@/components/HighlightedText";
import {
  AlertIcon,
  CheckIcon,
  ClipboardIcon,
  ExternalLinkIcon,
  FileTextIcon,
  HourglassIcon,
  PencilIcon,
  UndoIcon,
  UploadIcon,
  XIcon,
} from "@/components/icons";
import MistakeFix, { type LessonInfo } from "@/components/MistakeFix";
import RuleTag from "@/components/RuleTag";
import { MAX_TEXT_LENGTH_BY_MODE } from "@/lib/limits";
import type { Feedback } from "@/lib/validate-feedback";
import { EXAMPLE_ESSAY } from "./example-essay";

const MAX_LENGTH = MAX_TEXT_LENGTH_BY_MODE.essay;
// The counter turns amber from this many characters (90% of the limit).
const NEAR_LIMIT = Math.floor(MAX_LENGTH * 0.9);

const TRY_AGAIN = "We couldn't check your writing right now. Please try again.";
const WRITE_FIRST = "Please write something first.";
// Some browsers don't let a page read the clipboard, or the student says no.
const PASTE_BY_HAND = "Your browser didn't let us paste. Click in the box and press Ctrl+V (Cmd+V on a Mac).";
const TEXT_FILES_ONLY = "Please choose a text file (.txt).";
const EMPTY_FILE = "That file is empty.";
// A file bigger than this is surely not one essay, so it isn't read at all.
const MAX_FILE_BYTES = 200_000;

// The draft is kept in sessionStorage: only in this browser tab, on the
// student's own device, and deleted by the browser when the tab closes. It
// never goes to our server. Only the text is kept, never the feedback.
const DRAFT_KEY = "wenova-essay-draft";

function saveDraft(text: string) {
  // Storage can be turned off or full (for example in private windows), so
  // any error is ignored and the page works without saving.
  try {
    if (text === "") sessionStorage.removeItem(DRAFT_KEY);
    else sessionStorage.setItem(DRAFT_KEY, text);
  } catch {}
}

function loadDraft(): string {
  try {
    return sessionStorage.getItem(DRAFT_KEY) ?? "";
  } catch {
    return "";
  }
}

const primaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 font-bold text-on-primary transition-colors hover:bg-primary-hover active:bg-primary-hover aria-disabled:cursor-not-allowed aria-disabled:opacity-60 aria-disabled:hover:bg-primary";
const secondaryButton =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-primary bg-background px-[22px] py-[10px] font-bold text-primary transition-colors hover:bg-surface";
// The small "Clear" / "Undo clear" button inside the text box. 32px tall
// (still above WCAG's 24px minimum) with 16px text, so it stays out of the way
// of the writing.
const smallButton =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-divider bg-surface px-2.5 text-base font-bold text-primary transition-colors hover:border-primary";
// The start buttons in the empty box ("Paste text", "Upload file", "Try a
// sample"), with dashed borders like the reference design's.
const startButton =
  "pointer-events-auto inline-flex min-h-11 items-center gap-2 rounded-lg border border-dashed border-border bg-background px-4 font-bold text-primary transition-colors hover:border-primary hover:bg-surface";
const paneTitle = "text-lg leading-snug font-semibold md:text-xl";

// How each part of the feedback appears: it springs up into place. Used with
// a parent that staggers its children, so the parts arrive one by one.
const springIn: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 24 } },
};

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed === "" ? 0 : trimmed.split(/\s+/).length;
}

function plural(count: number, word: string) {
  return `${count.toLocaleString("en-US")} ${word}${count === 1 ? "" : "s"}`;
}

// Centered message in the feedback side before there is any feedback.
function CenteredState({ icon, title, children }: { icon: ReactNode; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-surface text-muted">
        {icon}
      </span>
      <h3 className="mt-4 text-lg font-semibold md:text-xl">{title}</h3>
      {children}
    </div>
  );
}

// One side of the card: a title row, then a body that scrolls on its own
// from 1024px up, so the page itself never has to.
function Pane({
  titleId,
  title,
  className = "",
  children,
}: {
  titleId: string;
  title: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={titleId} className={`min-h-0 min-w-0 flex-col ${className}`}>
      <div className="flex min-h-14 shrink-0 items-center px-4 md:px-5">{title}</div>
      <div className="flex min-h-0 flex-1 flex-col px-4 pb-4 md:px-5">{children}</div>
    </section>
  );
}

type Status = "editing" | "checking" | "results";

// The whole Essay Checker as one card, like the reference design: the
// student's writing on the left, the feedback on the right, and a bar at the
// bottom with the counter and the main button. Student writing is never
// logged or saved on a server; the current draft is kept in this browser tab
// only (see DRAFT_KEY).
export default function EssayChecker({ lessons }: { lessons: Record<string, LessonInfo> }) {
  // The text box. It also gets the applied fixes, so "Edit my writing" and
  // the saved draft include them.
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("editing");
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  // The exact text that was checked. The highlights are found in this text.
  const [checkedText, setCheckedText] = useState("");
  // The text from just before "Clear", so "Undo clear" can bring it back.
  // Forgotten as soon as the student types or picks the example.
  const [clearedText, setClearedText] = useState<string | null>(null);
  // The open mistake: an index in `mistakes` (text order), or null.
  const [selected, setSelected] = useState<number | null>(null);
  // The mistakes the student applied a fix to (indexes in `mistakes`).
  const [applied, setApplied] = useState<ReadonlySet<number>>(new Set());

  // The mistakes with their place in the text, in the order they appear.
  const mistakes = useMemo(
    () => (feedback ? locateMistakes(checkedText, feedback.mistakes) : []),
    [feedback, checkedText],
  );
  // The same mistakes, most important first (the order the server sent), for
  // the list in the Mistakes tab. `index` still points into `mistakes`.
  const mistakesByImportance = mistakes
    .map((mistake, index) => ({ mistake, index }))
    .sort((a, b) => a.mistake.rank - b.mistake.rank);

  const ruleTitle = (rule: string) => lessons[rule]?.title ?? "Other";

  // "What to work on": how many mistakes each lesson had (fixed ones count
  // too), the top 3, most mistakes first. Ties keep the order of the text.
  // "other" and rules without a lesson are left out: there's nothing to link.
  const lessonCounts = new Map<string, number>();
  for (const mistake of mistakes) {
    if (!lessons[mistake.rule]) continue;
    lessonCounts.set(mistake.rule, (lessonCounts.get(mistake.rule) ?? 0) + 1);
  }
  const workOn = [...lessonCounts.entries()]
    .map(([rule, count]) => ({ rule, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const cardRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  // The id of an element to move keyboard focus to once the page has updated
  // (for example a highlight, after its panel closes).
  const focusAfterUpdate = useRef<string | null>(null);

  const checking = status === "checking";
  const length = text.length;
  const tooLong = length > MAX_LENGTH;
  const nearLimit = length >= NEAR_LIMIT;
  const canCheck = text.trim() !== "" && !tooLong && !checking;

  // When results arrive, move focus to them. On phones they are under the
  // text box, so focusing also scrolls them into view. From 1024px up the
  // card grows to the window's full height, so the page scrolls down until
  // the card fills the screen; the hero stays above it, and the student can
  // scroll back up to it at any time.
  useEffect(() => {
    if (status !== "results") return;
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    resultsHeadingRef.current?.focus({ preventScroll: wide });
    if (wide) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      cardRef.current?.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
    }
  }, [status]);

  // Runs after every update: if a focus move is waiting, do it now that the
  // element is on the page.
  useEffect(() => {
    if (focusAfterUpdate.current === null) return;
    document.getElementById(focusAfterUpdate.current)?.focus();
    focusAfterUpdate.current = null;
  });

  // Coming back to the page: put the saved draft back in the box. This runs
  // once, after the first render, because the server can't see sessionStorage
  // (reading it during the first render would make the server's page and the
  // browser's page different).
  useEffect(() => {
    const draft = loadDraft();
    // Reading browser storage once is what effects are for, so the lint rule
    // against setting state in an effect is turned off for this line only.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (draft !== "") setText(draft);
  }, []);

  async function check(event: FormEvent) {
    event.preventDefault();
    if (checking) return;
    // The button only looks disabled (aria-disabled), so say why in words.
    if (text.trim() === "") {
      setError(WRITE_FIRST);
      return;
    }
    if (tooLong) return; // The counter already says how much to cut.

    const sent = text;
    setStatus("checking");
    setError(null);
    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "essay", text: sent }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok || !data || !Array.isArray(data.mistakes) || typeof data.summary !== "string") {
        // The route sends a friendly { error } message; use it when there is one.
        setError(typeof data?.error === "string" ? data.error : TRY_AGAIN);
        setStatus("editing");
        return;
      }

      setFeedback(data as Feedback);
      setCheckedText(sent);
      setSelected(null);
      setApplied(new Set());
      setStatus("results");
    } catch {
      // No internet, or the server didn't answer.
      setError(TRY_AGAIN);
      setStatus("editing");
    }
  }

  // Every change to the text goes through here, so the saved draft always
  // matches the box.
  function updateText(value: string) {
    setText(value);
    saveDraft(value);
  }

  function changeText(value: string) {
    updateText(value);
    setClearedText(null);
    setError(null); // An old error no longer fits the new text.
  }

  function tryExample() {
    changeText(EXAMPLE_ESSAY);
    textareaRef.current?.focus();
  }

  // "Paste text": reads the clipboard. The browser may ask the student first,
  // and some browsers don't allow it at all; then we explain Ctrl+V instead.
  async function pasteText() {
    try {
      const pasted = await navigator.clipboard.readText();
      if (pasted.trim() === "") {
        setError(PASTE_BY_HAND);
        return;
      }
      changeText(pasted);
      textareaRef.current?.focus();
    } catch {
      setError(PASTE_BY_HAND);
      textareaRef.current?.focus();
    }
  }

  // "Upload file": reads a plain .txt file here in the browser. Nothing is
  // sent anywhere until the student presses Check my writing. (Word files
  // would need an extra package, which CLAUDE.md says to ask about first.)
  async function uploadFile(file: File | undefined) {
    if (!file) return;
    const isText = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt");
    if (!isText || file.size > MAX_FILE_BYTES) {
      setError(TEXT_FILES_ONLY);
      return;
    }
    const contents = await file.text();
    if (contents.trim() === "") {
      setError(EMPTY_FILE);
      return;
    }
    changeText(contents); // A too-long file shows the usual "too many characters" message.
    textareaRef.current?.focus();
  }

  // Clearing also deletes the saved draft. "Undo clear" saves it again.
  function clear() {
    setClearedText(text);
    updateText("");
    setError(null);
    textareaRef.current?.focus();
  }

  function undoClear() {
    if (clearedText === null) return;
    updateText(clearedText);
    setClearedText(null);
    textareaRef.current?.focus();
  }

  // Apply or undo one fix. The highlights always come from the checked text,
  // and the text box gets that text with the applied fixes put in.
  function setFixApplied(index: number, isApplied: boolean) {
    const next = new Set(applied);
    if (isApplied) next.add(index);
    else next.delete(index);
    setApplied(next);
    updateText(withFixes(checkedText, mistakes, next));
  }

  // Closing the panel goes back to the tabs and puts keyboard focus back on
  // the highlight it came from.
  function closePanel() {
    if (selected === null) return;
    focusAfterUpdate.current = `mistake-${mistakes[selected].number}`;
    setSelected(null);
  }

  // Tapping a highlight opens that mistake; tapping it again closes it.
  function selectInText(index: number) {
    setSelected(selected === index ? null : index);
  }

  // Opens a mistake from the list or from Previous/Next, and scrolls its
  // highlight to the middle of the writing side, so the sentence around it
  // shows too. The scroll is instant (no animation).
  function openMistake(index: number) {
    setSelected(index);
    document
      .getElementById(`mistake-${mistakes[index].number}`)
      ?.scrollIntoView({ block: "center" });
  }

  // Back to the text box, with any applied fixes already in the text.
  function editAgain() {
    setStatus("editing");
    setFeedback(null);
    setSelected(null);
    setApplied(new Set());
    focusAfterUpdate.current = "essay"; // the text box, once it's back
  }

  // ---- Left side: the student's writing ----
  const writingPane =
    status === "results" ? (
      <Pane
        titleId="writing-title"
        title={
          <h2 id="writing-title" className={paneTitle}>
            Your writing
          </h2>
        }
        className="flex border-b border-divider lg:border-r lg:border-b-0"
      >
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <HighlightedText
            text={checkedText}
            mistakes={mistakes}
            applied={applied}
            selected={selected}
            onSelect={selectInText}
            ruleTitle={ruleTitle}
          />
        </div>
      </Pane>
    ) : (
      <Pane
        titleId="writing-title"
        title={
          <h2 id="writing-title" className={paneTitle}>
            <label htmlFor="essay">Your writing</label>
          </h2>
        }
        className="flex border-b border-divider lg:border-r lg:border-b-0"
      >
        <form id="essay-form" onSubmit={check} className="flex min-h-0 flex-1 flex-col gap-3">
          {/* The writing box. The keyboard focus ring goes around the whole
              box (it has the small buttons in it), not only the text area. */}
          <div
            className={`flex min-h-[300px] flex-1 flex-col rounded-lg border border-border has-[textarea:focus-visible]:[outline:3px_solid_var(--ring)] has-[textarea:focus-visible]:outline-offset-2 lg:min-h-0 ${
              checking ? "bg-surface" : "bg-background"
            }`}
          >
            {/* Small button inside the box, top right: "Clear" while there is
                text, "Undo clear" right after clearing. */}
            <div className="flex min-h-10 shrink-0 items-center justify-end gap-2 px-2 pt-2">
              {!checking && text !== "" && (
                <button type="button" onClick={clear} className={smallButton}>
                  <XIcon size={16} />
                  Clear
                </button>
              )}
              {!checking && text === "" && clearedText !== null && (
                <button type="button" onClick={undoClear} className={smallButton}>
                  <UndoIcon size={16} />
                  Undo clear
                </button>
              )}
            </div>

            {/* The text area, with the start buttons over it while it's
                empty (like the reference design). The layer over it lets
                clicks through to the text area, except on the buttons, so
                the student can still click anywhere and type. */}
            <div className="relative flex min-h-0 flex-1 flex-col">
              {text === "" && !checking && (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 px-4 pb-8 text-center">
                  <p className="text-muted">Paste your essay to get started</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button type="button" onClick={pasteText} className={startButton}>
                      <ClipboardIcon size={16} />
                      Paste text
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={startButton}
                    >
                      <UploadIcon size={16} />
                      Upload file
                    </button>
                    <button type="button" onClick={tryExample} className={startButton}>
                      <FileTextIcon size={16} />
                      Try a sample
                    </button>
                  </div>
                  {/* Hidden; the "Upload file" button opens it. Cleared after
                      each pick, so the same file can be chosen again. */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,text/plain"
                    tabIndex={-1}
                    aria-hidden="true"
                    className="hidden"
                    onChange={(event) => {
                      void uploadFile(event.target.files?.[0]);
                      event.target.value = "";
                    }}
                  />
                </div>
              )}
              <textarea
                id="essay"
                ref={textareaRef}
                value={text}
                onChange={(event) => changeText(event.target.value)}
                // Turn off the browser's spellcheck and the Grammarly extension in
                // this box, so they don't show the mistakes before Wenova does.
                spellCheck={false}
                data-gramm="false"
                // Locked while checking, so the highlights match the text that was sent.
                readOnly={checking}
                aria-describedby="essay-counter essay-too-long"
                className="block w-full flex-1 resize-none bg-transparent px-4 pt-1 pb-3 text-lg leading-[1.7] text-text focus-visible:outline-none"
              />
            </div>
          </div>

          {/* A live region, so screen readers hear it when the essay gets too long. */}
          <p id="essay-too-long" aria-live="polite" className="shrink-0 font-bold text-hint-text empty:hidden">
            {tooLong &&
              `That's ${plural(length - MAX_LENGTH, "character")} too many. Please make it shorter.`}
          </p>

          {error && (
            <div
              role="alert"
              className="flex shrink-0 animate-pop gap-3 rounded-lg border-2 border-hint-border bg-hint-bg px-4 py-3 text-hint-text"
            >
              <span className="mt-1">
                <AlertIcon />
              </span>
              <p className="font-bold">{error}</p>
            </div>
          )}
        </form>
      </Pane>
    );

  // ---- Right side, results: everything a student needs, in one view ----
  // Top to bottom: the grade (the first thing a student wants to know), the
  // summary, the lessons to practice, then the mistakes (the only part that
  // scrolls). Each part springs in a moment after the one before it.
  const resultsView = feedback && (
    <motion.div
      className="flex min-h-0 flex-1 flex-col gap-3"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.08 } } }}
    >
      {feedback.grade && (
        <motion.div variants={springIn} className="shrink-0">
          <GradeCard grade={feedback.grade} />
        </motion.div>
      )}

      <motion.p variants={springIn} className="shrink-0">
        {feedback.summary}
      </motion.p>

      {/* A suggestion, never automatic: the student decides whether to open
          a lesson. Links open in a new tab, so the results stay. */}
      {workOn.length > 0 && (
        <motion.section variants={springIn} aria-labelledby="practice-next-title" className="shrink-0">
          <h3 id="practice-next-title" className="text-base font-semibold md:text-lg">
            Practice next
          </h3>
          <ul className="mt-1.5 flex flex-wrap gap-2">
            {workOn.map(({ rule, count }) => (
              <li key={rule}>
                <motion.a
                  href={`/lessons/${rule}#practice-title`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-tag-bg px-3.5 font-bold text-tag-text transition-colors hover:bg-correct-bg"
                >
                  <span className="underline underline-offset-[3px]">{lessons[rule].title}</span>
                  <span className="rounded-full bg-background px-2 text-base leading-6 font-bold">
                    {count}
                  </span>
                  <ExternalLinkIcon size={16} />
                  <span className="sr-only">
                    ({plural(count, "mistake")}, opens in a new tab)
                  </span>
                </motion.a>
              </li>
            ))}
          </ul>
        </motion.section>
      )}

      {mistakes.length === 0 ? (
        // No mistakes: a positive state. A non-English essay also has no
        // mistakes; it's the one with grade null, and its summary already
        // asks for English, so it gets no "Nothing to fix".
        feedback.grade && (
          <motion.p
            variants={springIn}
            className="flex items-center gap-2 rounded-lg border-2 border-correct-border bg-correct-bg px-4 py-3 font-bold text-correct-text"
          >
            <CheckIcon />
            Nothing to fix. Great work!
          </motion.p>
        )
      ) : (
        <motion.section
          variants={springIn}
          aria-labelledby="mistakes-title"
          className="flex min-h-0 flex-1 flex-col"
        >
          <h3 id="mistakes-title" className="shrink-0 text-base font-semibold md:text-lg">
            {plural(mistakes.length, "mistake")}{" "}
            <span className="text-base font-normal text-muted">· most important first</span>
          </h3>
          <motion.ul
            className="mt-2 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1"
            variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } } }}
          >
            {mistakesByImportance.map(({ mistake, index }) => (
              <motion.li key={mistake.start} variants={springIn}>
                <motion.button
                  type="button"
                  onClick={() => openMistake(index)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full flex-col gap-1.5 rounded-lg border-2 border-divider p-3 text-left transition-colors hover:border-primary"
                >
                  {/* On narrow screens the rule tag moves to its own line
                      instead of squeezing "Mistake 1". */}
                  <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <span className="flex items-center gap-2 font-bold whitespace-nowrap text-muted">
                      Mistake {mistake.number}
                      {applied.has(index) && (
                        <span className="flex items-center gap-1 text-correct-text">
                          <CheckIcon />
                          Fixed
                        </span>
                      )}
                    </span>
                    <RuleTag title={lessons[mistake.rule]?.title} />
                  </span>
                  <span className="text-lg">
                    {applied.has(index) ? (
                      <span className="rounded bg-correct-bg px-0.5 underline decoration-correct-border decoration-2 underline-offset-4 [box-decoration-break:clone]">
                        {mistake.fix}
                      </span>
                    ) : (
                      <span className="rounded bg-mistake-bg px-0.5 underline decoration-mistake-line decoration-wavy decoration-2 underline-offset-4 [box-decoration-break:clone]">
                        {mistake.original}
                      </span>
                    )}
                  </span>
                </motion.button>
              </motion.li>
            ))}
          </motion.ul>
        </motion.section>
      )}
    </motion.div>
  );

  // ---- Right side: the feedback ----
  const feedbackPane = (
    <Pane
      titleId="feedback-title"
      title={
        <h2 id="feedback-title" ref={resultsHeadingRef} tabIndex={-1} className={paneTitle}>
          Your feedback
        </h2>
      }
      // Before the first check there is nothing here, so phones skip it.
      className={status === "editing" ? "hidden lg:flex" : "flex"}
    >
      {/* Always on the page and empty until checking starts, so screen
          readers announce it. The box below shows the same words. */}
      <p role="status" className="sr-only">
        {checking ? "Checking your writing…" : ""}
      </p>

      {status === "editing" && (
        <CenteredState icon={<FileTextIcon size={32} />} title="Ready when you are">
          <p className="mt-2 text-muted">Paste your essay and press Check my writing.</p>
        </CenteredState>
      )}

      {checking && (
        <div aria-hidden="true" className="flex flex-1 flex-col">
          <CenteredState icon={<HourglassIcon size={32} />} title="Checking your writing…" />
        </div>
      )}

      {/* Results: the overview, or one open mistake's fix panel, which
          slides in from the side (and back out) when it opens and closes.
          The panel's Close button (or Escape) goes back to the overview. */}
      {status === "results" && feedback && (
        <AnimatePresence mode="wait" initial={false}>
          {selected !== null ? (
            <motion.div
              key={`fix-${mistakes[selected].start}`}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {/* The key starts the panel fresh for each mistake. */}
              <MistakeFix
                key={mistakes[selected].start}
                mistake={mistakes[selected]}
                total={mistakes.length}
                lesson={lessons[mistakes[selected].rule]}
                applied={applied.has(selected)}
                onApply={() => setFixApplied(selected, true)}
                onUndo={() => setFixApplied(selected, false)}
                onClose={closePanel}
                // Previous and Next follow the order of the text.
                onPrevious={selected > 0 ? () => openMistake(selected - 1) : undefined}
                onNext={selected < mistakes.length - 1 ? () => openMistake(selected + 1) : undefined}
              />
            </motion.div>
          ) : (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 32 }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="flex min-h-0 flex-1 flex-col"
            >
              {resultsView}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </Pane>
  );

  // ---- Bottom bar ----
  const footer =
    status === "results" ? (
      <>
        <p className="font-bold">
          {mistakes.length > 0
            ? `${plural(mistakes.length, "thing")} to fix${applied.size > 0 ? ` · ${applied.size} fixed` : ""}`
            : ""}
        </p>
        <button type="button" onClick={editAgain} className={secondaryButton}>
          <PencilIcon />
          Edit my writing
        </button>
      </>
    ) : (
      <>
        <p
          id="essay-counter"
          className={nearLimit ? "font-bold text-hint-text" : "text-muted"}
        >
          {plural(countWords(text), "word")} · {length.toLocaleString("en-US")} /{" "}
          {MAX_LENGTH.toLocaleString("en-US")} characters
          {nearLimit && !tooLong && " · Almost at the limit"}
        </p>
        {/* Outside the <form>, so it names the form it sends. */}
        <button type="submit" form="essay-form" aria-disabled={!canCheck} className={primaryButton}>
          {checking ? (
            <>
              <HourglassIcon />
              Checking your writing…
            </>
          ) : (
            "Check my writing"
          )}
        </button>
      </>
    );

  return (
    // data-status lets the screen around the card react to it (from 1024px
    // up the card is the window's full height while results are showing; see
    // CheckerScreen.tsx). scroll-mt keeps it clear of the sticky header when
    // the page scrolls to it.
    <div
      ref={cardRef}
      data-status={status}
      className="flex h-full scroll-mt-[calc(var(--header-height)+0.75rem)] flex-col overflow-hidden rounded-2xl border border-divider bg-background shadow-sm"
    >
      {/* The gradient line along the top, in the logo's blue and green.
          While checking, a light moves along it. Decoration only. */}
      <div aria-hidden="true" className="relative h-1 shrink-0 overflow-hidden bg-linear-to-r from-primary to-logo-green">
        {checking && (
          <span className="absolute inset-y-0 left-0 w-1/3 animate-shimmer bg-linear-to-r from-transparent via-white/90 to-transparent" />
        )}
      </div>

      {/* The two sides. From 1024px up they sit side by side and fill the
          card's height; below that they stack. */}
      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {writingPane}
        {feedbackPane}
      </div>

      <div className="flex shrink-0 flex-col gap-3 border-t border-divider bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
        {footer}
      </div>
    </div>
  );
}
