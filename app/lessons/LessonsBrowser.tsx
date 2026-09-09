import Link from "next/link";
import type { ReactNode } from "react";
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

export default function LessonsBrowser({
  cards,
  groups,
}: {
  cards: LessonCard[];
  groups: { id: string; title: string; count: number }[];
}) {
  const sections = groups
    .map((group) => ({ ...group, cards: cards.filter((card) => card.groupId === group.id) }))
    .filter((group) => group.cards.length > 0);

  return (
    <div>
      <p className="text-muted">
        {plural(cards.length, "lesson")} in {plural(groups.length, "section")}
      </p>

      {sections.map((section) => (
        <section
          key={section.id}
          aria-labelledby={`section-${section.id}`}
          className="mt-6 grid gap-4 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-8"
        >
          <div className="lg:pt-2">
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
          </div>

          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.cards.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/lessons/${card.id}`}
                  className="group relative flex h-full flex-col rounded-2xl border border-divider bg-background p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-md"
                >
                  <span className="absolute top-4 right-4 text-muted transition-transform duration-300 group-hover:translate-x-[3px] group-hover:-translate-y-[3px]">
                    <Icon size={18}>
                      <path d="M7 7h10v10" />
                      <path d="M7 17 17 7" />
                    </Icon>
                  </span>
                  <span className="flex size-12 items-center justify-center rounded-xl bg-tag-bg text-tag-text">
                    <Icon size={26}>{LESSON_ICONS[card.id] ?? BOOK_ICON}</Icon>
                  </span>
                  <h3 className="mt-4 text-lg leading-snug font-semibold md:text-xl">{card.title}</h3>
                  <p className="mt-1 line-clamp-2 text-muted">{card.summary}</p>
                  <p className="mt-auto pt-3 text-base font-bold text-muted">
                    Lesson {card.number} · {plural(getQuizLengths(card.questions).max, "question")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
