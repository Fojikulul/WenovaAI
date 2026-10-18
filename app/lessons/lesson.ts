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

// The text up to the first ".", "!" or "?" that ends a sentence, for the
// short rule on the lesson list. The full rule stays on the lesson page.
export function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  return match ? match[0] : text;
}
