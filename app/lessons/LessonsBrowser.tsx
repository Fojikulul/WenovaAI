"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import PillTabs, { type PillTab } from "@/components/PillTabs";
import type { LessonCard } from "./lesson";

// Icons: path data from Lucide (lucide.dev), ISC license. They are decorative,
// so screen readers skip them; the words next to each one say the same thing.
function Icon({ children, size = 20, className = "" }: { children: ReactNode; size?: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={`shrink-0 ${className}`}
    >
      {children}
    </svg>
  );
}

// A picture for each lesson's card tile, chosen to hint at the rule
// (decoration only). A lesson without one gets the book.
const LESSON_ICONS: Record<string, ReactNode> = {
  // Habits and routines: repeat
  "present-simple": (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  // Happening right now: play
  "present-continuous": <path d="M6 3 20 12 6 21 6 3z" />,
  // Finished in the past: history clock
  "past-simple": (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  // In progress in the past: rewind
  "past-continuous": (
    <>
      <path d="M11 19 2 12l9-7v14z" />
      <path d="M22 19 13 12l9-7v14z" />
    </>
  ),
  // Past that connects to now: clock
  "present-perfect": (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  // Before another past event: layers
  "past-perfect": (
    <>
      <path d="m12 2 10 5-10 5L2 7l10-5z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </>
  ),
  // The future: fast-forward
  future: (
    <>
      <path d="M13 19 22 12l-9-7v14z" />
      <path d="M2 19 11 12 2 5v14z" />
    </>
  ),
  // a / an / the: letters
  articles: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </>
  ),
  // in / on / at a place: map pin
  "prepositions-in-on-at": (
    <>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  // Subject and verb go together: link
  "subject-verb-agreement": (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  // One or many: copies
  plurals: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
  // Questions: question mark
  "question-word-order": (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </>
  ),
};
const BOOK_ICON = (
  <>
    <path d="M12 7v14" />
    <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
  </>
);

// One line about each section, shown beside its cards.
const GROUP_BLURBS: Record<string, string> = {
  "verb-tenses": "When things happen: now, before, and later.",
  "grammar-basics": "The small words and patterns in every sentence.",
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// The words a search looks at for one lesson.
function matches(card: LessonCard, query: string) {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return `${card.title} ${card.summary} ${card.groupTitle}`.toLowerCase().includes(q);
}

// The lesson list, in the style of melies.co/ai-tools: a toolbar with a
// search box ("/" jumps to it), filter pills, and "Pick one for me"; then
// each section with its name on the left and its lesson cards on the right.
// Motion: the filter pill springs across, cards spring in as they scroll into
// view, and when a search or filter changes, the cards that stay slide to
// their new places while the others fade out.
export default function LessonsBrowser({
  cards,
  groups,
}: {
  cards: LessonCard[];
  groups: { id: string; title: string; count: number }[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  // "/" jumps to the search box, like on the reference site (but not while
  // the student is typing somewhere).
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement;
      const typing = target.closest("input, textarea, [contenteditable]");
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = cards.filter(
    (card) => (filter === "all" || card.groupId === filter) && matches(card, query),
  );
  const sections = groups
    .map((group) => ({ ...group, cards: shown.filter((card) => card.groupId === group.id) }))
    .filter((group) => group.cards.length > 0);

  const tabs: PillTab[] = [
    { id: "all", label: "All lessons", badge: cards.length },
    ...groups.map((group) => ({ id: group.id, label: group.title, badge: group.count })),
  ];

  // "Pick one for me": opens a random lesson from the ones showing now.
  function pickOne() {
    const pool = shown.length > 0 ? shown : cards;
    const card = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/lessons/${card.id}`);
  }

  return (
    // "relative" makes this paint above the hero's glow, which reaches down
    // behind it (without it, the glow covered the cards once they finished
    // animating after a filter change).
    <div className="relative">
      {/* Toolbar: search, filter pills, and "Pick one for me". */}
      <div className="flex flex-col gap-2 rounded-2xl border border-divider bg-surface p-2 shadow-sm lg:flex-row lg:items-center">
        <label className="flex min-h-12 flex-1 items-center gap-3 rounded-xl border border-border bg-background px-3 has-[input:focus-visible]:[outline:3px_solid_var(--ring)] has-[input:focus-visible]:outline-offset-2">
          <Icon className="text-muted">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </Icon>
          <span className="sr-only">Search lessons</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons, like “past”…"
            className="min-w-0 flex-1 bg-transparent py-2 text-text placeholder:text-muted focus-visible:outline-none"
          />
          <kbd
            aria-hidden="true"
            className="hidden rounded-md border border-divider px-2 font-mono text-base leading-6 text-muted sm:inline"
          >
            /
          </kbd>
        </label>
        <PillTabs tabs={tabs} selected={filter} onSelect={setFilter} idPrefix="lessons" label="Filter lessons" />
        <motion.button
          type="button"
          onClick={pickOne}
          whileHover="hover"
          whileTap={{ scale: 0.97 }}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 font-bold text-primary transition-colors hover:bg-surface"
        >
          {/* The shuffle arrows spin when the button is hovered. */}
          <motion.span variants={{ hover: { rotate: 180 } }} transition={{ type: "spring", stiffness: 300, damping: 15 }}>
            <Icon>
              <path d="m18 14 4 4-4 4" />
              <path d="m18 2 4 4-4 4" />
              <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
              <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
              <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
            </Icon>
          </motion.span>
          Pick one for me
        </motion.button>
      </div>

      {/* Like the reference's "Try a task" line. */}
      <p className="mt-3 px-1 text-muted">
        Not sure where to start?{" "}
        <Link
          href="/"
          className="font-bold text-secondary underline underline-offset-[3px] transition-colors hover:text-secondary-hover"
        >
          Check an essay
        </Link>{" "}
        and we&apos;ll suggest lessons.
      </p>

      <p className="mt-6 text-muted" aria-live="polite">
        {shown.length === cards.length
          ? `${plural(cards.length, "lesson")} in ${plural(groups.length, "section")}`
          : `Showing ${plural(shown.length, "lesson")}`}
      </p>

      <div id={`lessons-panel-${filter}`} role="tabpanel" aria-labelledby={`lessons-tab-${filter}`}>
        {sections.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center"
          >
            <p className="font-bold">No lessons match “{query}”.</p>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="mt-3 inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-[3px]"
            >
              Clear the search
            </button>
          </motion.div>
        )}

        <AnimatePresence mode="popLayout">
          {sections.map((section) => (
            <motion.section
              key={section.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-labelledby={`section-${section.id}`}
              className="mt-6 grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8"
            >
              {/* Section name, a green dot, how many lessons, and one line. */}
              <motion.div
                layout="position"
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                className="lg:pt-2"
              >
                <h2 id={`section-${section.id}`} className="flex items-center gap-2 text-2xl font-semibold">
                  {section.title}
                  <span aria-hidden="true" className="size-2 rounded-full bg-logo-green" />
                  <span className="rounded-lg border border-divider px-2 text-base leading-7 font-bold text-muted">
                    <span className="sr-only">: </span>
                    {section.cards.length}
                    <span className="sr-only"> lessons</span>
                  </span>
                </h2>
                {GROUP_BLURBS[section.id] && <p className="mt-2 text-muted">{GROUP_BLURBS[section.id]}</p>}
              </motion.div>

              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence mode="popLayout">
                  {section.cards.map((card, position) => (
                    <motion.li
                      key={card.id}
                      layout
                      initial={{ opacity: 0, y: 24, scale: 0.96 }}
                      whileInView={{ opacity: 1, y: 0, scale: 1 }}
                      viewport={{ once: true, margin: "0px 0px -40px 0px" }}
                      exit={{ opacity: 0, scale: 0.92 }}
                      transition={{ type: "spring", stiffness: 300, damping: 26, delay: (position % 3) * 0.06 }}
                    >
                      <motion.div whileHover="hover" whileTap={{ scale: 0.98 }} variants={{ hover: { y: -4 } }} className="h-full">
                        <Link
                          href={`/lessons/${card.id}`}
                          className="relative flex h-full flex-col rounded-2xl border border-divider bg-background p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary hover:shadow-md"
                        >
                          {/* Arrow in the top right corner; it moves up and
                              right when the card is hovered. */}
                          <motion.span
                            variants={{ hover: { x: 3, y: -3 } }}
                            className="absolute top-4 right-4 text-muted"
                          >
                            <Icon size={18}>
                              <path d="M7 7h10v10" />
                              <path d="M7 17 17 7" />
                            </Icon>
                          </motion.span>
                          {/* Icon tile for the lesson; it tilts a little on hover. */}
                          <motion.span
                            variants={{ hover: { rotate: -8, scale: 1.08 } }}
                            transition={{ type: "spring", stiffness: 400, damping: 14 }}
                            className="flex size-12 items-center justify-center rounded-xl bg-tag-bg text-tag-text"
                          >
                            <Icon size={26}>{LESSON_ICONS[card.id] ?? BOOK_ICON}</Icon>
                          </motion.span>
                          <h3 className="mt-5 text-lg leading-snug font-semibold md:text-xl">{card.title}</h3>
                          <p className="mt-1 line-clamp-2 text-muted">{card.summary}</p>
                          <p className="mt-auto pt-3 text-base font-bold text-muted">
                            Lesson {card.number} · {plural(card.questions, "question")}
                          </p>
                        </Link>
                      </motion.div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
