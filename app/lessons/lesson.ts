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

export type LessonGroup = { id: string; title: string; lessons: Lesson[] };

export type LessonCard = {
  id: string;
  number: number;
  title: string;
  summary: string;
  questions: number;
  groupId: string;
  groupTitle: string;
};

// Typed so the build fails if lessons.json drifts from the contract.
const lessons: Lesson[] = lessonsData;

const LESSON_GROUPS = [
  {
    id: "verb-tenses",
    title: "Verb Tenses",
    lessonIds: ["present-simple", "present-continuous", "past-simple", "past-continuous", "present-perfect", "past-perfect", "future"],
  },
  {
    id: "grammar-basics",
    title: "Grammar Basics",
    lessonIds: ["articles", "prepositions-in-on-at", "subject-verb-agreement", "plurals", "question-word-order"],
  },
];

const ABBREVIATIONS = ["e.g.", "i.e.", "mr.", "mrs.", "ms.", "dr.", "vs.", "a.m.", "p.m."];

export const getLessons = (): Lesson[] => lessons;
export const getLesson = (id: string): Lesson | undefined => lessons.find((lesson) => lesson.id === id);

// Ungrouped lessons land in "More lessons" so a new one never disappears.
export function getLessonGroups(): LessonGroup[] {
  const groups: LessonGroup[] = LESSON_GROUPS.map(({ id, title, lessonIds }) => ({
    id,
    title,
    lessons: lessonIds.map(getLesson).filter((lesson): lesson is Lesson => lesson !== undefined),
  }));
  const grouped = new Set(LESSON_GROUPS.flatMap((group) => group.lessonIds));
  const rest = lessons.filter((lesson) => !grouped.has(lesson.id));
  return rest.length > 0 ? [...groups, { id: "more", title: "More lessons", lessons: rest }] : groups;
}

export function getLessonCards(): LessonCard[] {
  return getLessonGroups()
    .flatMap((group) => group.lessons.map((lesson) => ({ group, lesson })))
    .map(({ group, lesson }, index) => ({
      id: lesson.id,
      number: index + 1,
      title: lesson.title,
      summary: firstSentence(lesson.rule),
      questions: lesson.practice.length,
      groupId: group.id,
      groupTitle: group.title,
    }));
}

export function getLessonPlace(id: string) {
  const cards = getLessonCards();
  const index = cards.findIndex((card) => card.id === id);
  if (index === -1) return undefined;
  return { card: cards[index], total: cards.length, previous: cards[index - 1], next: cards[index + 1] };
}

// Splits on . ! ? followed by a capital or quote, allowing ** / __ marks around the boundary.
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
  return sentences.filter(Boolean);
}

export const firstSentence = (text: string) => plainRuleText(ruleSentences(text)[0] ?? text);
