import lessonsData from "@/data/lessons.json";
import { plainRuleText } from "@/lib/rule-text";

export type PracticeQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

export type Lesson = {
  id: string;
  title: string;
  rule: string;
  example: string;
  mistake: { wrong: string; right: string };
  practice: PracticeQuestion[];
  writingPrompts?: string[];
};

// Typed as Lesson[] so the build fails if a lesson doesn't match.
const lessons: Lesson[] = lessonsData;

export function getLessons(): Lesson[] {
  return lessons;
}

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}

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

export type LessonCard = {
  id: string;
  number: number;
  title: string;
  summary: string;
  questions: number;
  groupId: string;
  groupTitle: string;
};

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

const ABBREVIATIONS = ["e.g.", "i.e.", "mr.", "mrs.", "ms.", "dr.", "vs.", "a.m.", "p.m."];

export function ruleSentences(rule: string): string[] {
  const sentences: string[] = [];
  let start = 0;
  for (const match of rule.matchAll(/[.!?][*_]*(?=\s+[*_]*["'‘“A-Z])/g)) {
    const end = match.index + match[0].length;
    const lastWord = plainRuleText(rule.slice(start, end)).trim().split(/\s+/).pop() ?? "";
    if (ABBREVIATIONS.includes(lastWord.replace(/^["'‘“(]+/, "").toLowerCase())) continue;
    sentences.push(rule.slice(start, end).trim());
    start = end;
  }
  sentences.push(rule.slice(start).trim());
  return sentences.filter((sentence) => sentence.length > 0);
}

export function firstSentence(text: string): string {
  return plainRuleText(ruleSentences(text)[0] ?? text);
}
