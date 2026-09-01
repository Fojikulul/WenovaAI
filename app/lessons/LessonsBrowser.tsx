import Link from "next/link";
import type { LessonCard } from "./lesson";

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
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`section-${section.id}`} className="mt-8">
          <h2 id={`section-${section.id}`} className="text-2xl font-semibold">
            {section.title} <span className="text-muted">({section.cards.length})</span>
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {section.cards.map((card) => (
              <li key={card.id}>
                <Link
                  href={`/lessons/${card.id}`}
                  className="flex h-full flex-col rounded-2xl border border-divider bg-background p-5 shadow-sm transition-colors hover:border-primary"
                >
                  <h3 className="text-lg leading-snug font-semibold md:text-xl">{card.title}</h3>
                  <p className="mt-1 text-muted">{card.summary}</p>
                  <p className="mt-auto pt-3 text-base font-bold text-muted">
                    Lesson {card.number} · {plural(card.questions, "question")}
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
