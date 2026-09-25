"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { DifficultyBadge } from "@/components/LessonBadges";
import PillTabs, { type PillTab } from "@/components/PillTabs";
import { DIFFICULTIES, DIFFICULTY_LABELS, lessonDifficulty, type Difficulty } from "@/lib/learning";
import type { LessonCard } from "./lesson";
import { getQuizLengths } from "./quiz-lengths";

// Icon paths from Lucide (lucide.dev), ISC license.
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

const LESSON_ICONS: Record<string, ReactNode> = {
  "present-simple": (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  "present-continuous": <path d="M6 3 20 12 6 21 6 3z" />,
  "past-simple": (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l4 2" />
    </>
  ),
  "past-continuous": (
    <>
      <path d="M11 19 2 12l9-7v14z" />
      <path d="M22 19 13 12l9-7v14z" />
    </>
  ),
  "present-perfect": (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </>
  ),
  "past-perfect": (
    <>
      <path d="m12 2 10 5-10 5L2 7l10-5z" />
      <path d="m2 17 10 5 10-5" />
      <path d="m2 12 10 5 10-5" />
    </>
  ),
  future: (
    <>
      <path d="M13 19 22 12l-9-7v14z" />
      <path d="M2 19 11 12 2 5v14z" />
    </>
  ),
  articles: (
    <>
      <path d="M4 7V4h16v3" />
      <path d="M9 20h6" />
      <path d="M12 4v16" />
    </>
  ),
  "prepositions-in-on-at": (
    <>
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
      <circle cx="12" cy="10" r="3" />
    </>
  ),
  "subject-verb-agreement": (
    <>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </>
  ),
  plurals: (
    <>
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
    </>
  ),
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

const GROUP_BLURBS: Record<string, string> = {
  "verb-tenses": "When things happen: now, before, and later.",
  "grammar-basics": "The small words and patterns in every sentence.",
};

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

function matches(card: LessonCard, query: string) {
  const q = query.trim().toLowerCase();
  if (q === "") return true;
  return `${card.title} ${card.summary} ${card.groupTitle} ${lessonDifficulty(card.id)}`.toLowerCase().includes(q);
}

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
  const [difficulty, setDifficulty] = useState<Difficulty | "any">("any");
  const searchRef = useRef<HTMLInputElement>(null);

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
    (card) =>
      (filter === "all" || card.groupId === filter) &&
      (difficulty === "any" || lessonDifficulty(card.id) === difficulty) &&
      matches(card, query),
  );
  const sections = groups
    .map((group) => ({ ...group, cards: shown.filter((card) => card.groupId === group.id) }))
    .filter((group) => group.cards.length > 0);

  const tabs: PillTab[] = [
    { id: "all", label: "All lessons", badge: cards.length },
    ...groups.map((group) => ({ id: group.id, label: group.title, badge: group.count })),
  ];

  function pickOne() {
    const pool = shown.length > 0 ? shown : cards;
    const card = pool[Math.floor(Math.random() * pool.length)];
    router.push(`/lessons/${card.id}`);
  }

  return (
    // "relative" keeps this above the hero's glow.
    <div className="relative">
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
        {/* CSS hover, not Motion's whileHover: a Motion hover can stay stuck after coming back to the page. */}
        <button
          type="button"
          onClick={pickOne}
          className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-primary bg-background px-4 font-bold text-primary transition-[background-color,transform] hover:bg-surface active:scale-[0.97]"
        >
          <span className="transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-180">
            <Icon>
              <path d="m18 14 4 4-4 4" />
              <path d="m18 2 4 4-4 4" />
              <path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22" />
              <path d="M2 6h1.972a4 4 0 0 1 3.6 2.2" />
              <path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45" />
            </Icon>
          </span>
          Pick one for me
        </button>
      </div>

      <div role="group" aria-label="Filter by difficulty" className="mt-3 flex flex-wrap items-center gap-2">
        <span className="mr-1 font-bold text-muted">Difficulty:</span>
        {(["any", ...DIFFICULTIES] as const).map((level) => {
          const selected = difficulty === level;
          return (
            <button
              key={level}
              type="button"
              aria-pressed={selected}
              onClick={() => setDifficulty(level)}
              className={`relative inline-flex min-h-11 items-center rounded-full px-4 font-bold transition-colors ${
                selected ? "text-heading" : "text-muted hover:text-heading"
              }`}
            >
              {selected && (
                <motion.span
                  layoutId="difficulty-pill"
                  className="absolute inset-0 rounded-full border-2 border-primary bg-background shadow-sm"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">{level === "any" ? "Any" : DIFFICULTY_LABELS[level]}</span>
            </button>
          );
        })}
      </div>

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
            <p className="font-bold">
              {query.trim() ? <>No lessons match “{query}”.</> : "No lessons match these filters."}
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setDifficulty("any");
                setFilter("all");
              }}
              className="mt-3 inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-[3px]"
            >
              Clear the filters
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
                      {/* CSS hover, not Motion's whileHover: a Motion hover can stay stuck after coming back to the page. */}
                      <div className="h-full">
                        <Link
                          href={`/lessons/${card.id}`}
                          className="group relative flex h-full flex-col rounded-2xl border border-divider bg-background p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:-translate-y-1 hover:border-primary hover:shadow-md active:scale-[0.98]"
                        >
                          <span className="absolute top-4 right-4 text-muted transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:translate-x-[3px] group-hover:-translate-y-[3px]">
                            <Icon size={18}>
                              <path d="M7 7h10v10" />
                              <path d="M7 17 17 7" />
                            </Icon>
                          </span>
                          <span className="flex size-12 items-center justify-center rounded-xl bg-tag-bg text-tag-text transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-108 group-hover:-rotate-8">
                            <Icon size={26}>{LESSON_ICONS[card.id] ?? BOOK_ICON}</Icon>
                          </span>
                          <div className="mt-4 flex flex-wrap gap-1.5">
                            <DifficultyBadge difficulty={lessonDifficulty(card.id)} />
                          </div>
                          <h3 className="mt-3 text-lg leading-snug font-semibold md:text-xl">{card.title}</h3>
                          <p className="mt-1 line-clamp-2 text-muted">{card.summary}</p>
                          <p className="mt-auto pt-3 text-base font-bold text-muted">
                            Lesson {card.number} · {plural(getQuizLengths(card.questions).max, "question")}
                          </p>
                        </Link>
                      </div>
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
