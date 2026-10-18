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

// The text up to the first ".", "!" or "?" that ends a sentence, for the
// short rule on the lesson list. The full rule stays on the lesson page.
export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}
