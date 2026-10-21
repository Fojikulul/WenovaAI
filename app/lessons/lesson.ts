import lessonsData from "@/data/lessons.json";

// One multiple-choice question. `answer` must be exactly one of `options`.
export type PracticeQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

// One lesson, matching the "One lesson in data/lessons.json" contract in CLAUDE.md.
export type Lesson = {
  id: string;
  title: string;
  rule: string;
  example: string;
  mistake: { wrong: string; right: string };
  practice: PracticeQuestion[];
  // Optional until the team writes the prompts; then make it required.
  writingPrompts?: string[];
};

// Typing the JSON as Lesson[] makes the build fail if a lesson in the file
// doesn't match the contract (for example a missing "rule").
const lessons: Lesson[] = lessonsData;

export function getLessons(): Lesson[] {
  return lessons;
}

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

// The sections on the lesson list. This lives here, not in data/lessons.json,
// so the data contract stays the same.
const LESSON_GROUPS = [
  {
    id: "verb-tenses",
    title: "Verb Tenses",
    lessonIds: [
      "present-simple",
      "present-continuous",
      "past-simple",
      "past-continuous",
      "present-perfect",
      "past-perfect",
      "future",
    ],
  },
  {
    id: "grammar-basics",
    title: "Grammar Basics",
    lessonIds: [
      "articles",
      "prepositions-in-on-at",
      "subject-verb-agreement",
      "plurals",
      "question-word-order",
    ],
  },
];

export type LessonGroup = {
  id: string;
  title: string;
  lessons: Lesson[];
};

// The groups with their lessons. A lesson that isn't in any group goes into
// "More lessons" at the end, so a new lesson never disappears from the list.
export function getLessonGroups(): LessonGroup[] {
  const groups: LessonGroup[] = LESSON_GROUPS.map((group) => ({
    id: group.id,
    title: group.title,
    lessons: group.lessonIds
      .map((id) => getLesson(id))
      .filter((lesson): lesson is Lesson => lesson !== undefined),
  }));

  const grouped = new Set(LESSON_GROUPS.flatMap((group) => group.lessonIds));
  const rest = lessons.filter((lesson) => !grouped.has(lesson.id));
  if (rest.length > 0) {
    groups.push({ id: "more", title: "More lessons", lessons: rest });
  }
  return groups;
}

// One lesson as a card on the lesson list: only what the card shows, so the
// browser gets a small list instead of every question.
export type LessonCard = {
  id: string;
  number: number; // 1-12, in list order across the sections
  title: string;
  summary: string; // the rule's first sentence
  questions: number;
  groupId: string;
  groupTitle: string;
};

// All lessons in list order, numbered across the sections.
export function getLessonCards(): LessonCard[] {
  let number = 0;
  return getLessonGroups().flatMap((group) =>
    group.lessons.map((lesson) => ({
      id: lesson.id,
      number: ++number,
      title: lesson.title,
      summary: firstSentence(lesson.rule),
      questions: lesson.practice.length,
      groupId: group.id,
      groupTitle: group.title,
    })),
  );
}

// Where a lesson sits in the list: its number, its section, and the lessons
// before and after it (for "Previous lesson" / "Next lesson").
export function getLessonPlace(id: string) {
  const cards = getLessonCards();
  const index = cards.findIndex((card) => card.id === id);
  if (index === -1) return undefined;
  return {
    card: cards[index],
    total: cards.length,
    previous: cards[index - 1],
    next: cards[index + 1],
  };
}

// Short words that end with "." but don't end a sentence.
const ABBREVIATIONS = ["e.g.", "i.e.", "mr.", "mrs.", "ms.", "dr.", "vs.", "a.m.", "p.m."];

// Splits a rule into sentences, so the lesson page can show it as a list.
// A sentence ends at ".", "!" or "?" followed by a space and then a capital
// letter or a quote, unless the word before is one of the abbreviations.
export function ruleSentences(rule: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  for (const match of rule.matchAll(/[.!?](?=\s+["'‘“A-Z])/g)) {
    const end = match.index + 1;
    const lastWord = rule.slice(start, end).trim().split(/\s+/).pop() ?? "";
    // "(e.g." counts as "e.g.", so strip a bracket or quote at the start.
    if (ABBREVIATIONS.includes(lastWord.replace(/^["'‘“(]+/, "").toLowerCase())) continue;
    sentences.push(rule.slice(start, end).trim());
    start = end;
  }
  sentences.push(rule.slice(start).trim());
  return sentences.filter((sentence) => sentence.length > 0);
}

// The first sentence of a rule, for the short rule on the lesson list. The
// full rule stays on the lesson page.
export function firstSentence(text: string): string {
  return ruleSentences(text)[0] ?? text;
}
