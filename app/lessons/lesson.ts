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

// Where a lesson is in the list: its number (1-12, the same numbers the list
// page shows), its section, and the lesson after it (none for the last one).
export type LessonPosition = {
  number: number;
  total: number;
  groupTitle: string;
  next: Lesson | undefined;
};

export function getLessonPosition(id: string): LessonPosition | undefined {
  const ordered = getLessonGroups().flatMap((group) =>
    group.lessons.map((lesson) => ({ lesson, groupTitle: group.title })),
  );
  const index = ordered.findIndex((item) => item.lesson.id === id);
  if (index === -1) return undefined;
  return {
    number: index + 1,
    total: ordered.length,
    groupTitle: ordered[index].groupTitle,
    next: ordered[index + 1]?.lesson,
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
