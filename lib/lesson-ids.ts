// Lesson ids from CLAUDE.md. When data/lessons.json is written, read the ids
// from that file instead so the two lists can't drift apart.
export const LESSON_IDS = [
  "present-simple",
  "present-continuous",
  "past-simple",
  "past-continuous",
  "present-perfect",
  "past-perfect",
  "future",
  "articles",
  "prepositions-in-on-at",
  "subject-verb-agreement",
  "plurals",
  "question-word-order",
] as const;

export type LessonId = (typeof LESSON_IDS)[number];

export function isLessonId(value: string): value is LessonId {
  return (LESSON_IDS as readonly string[]).includes(value);
}
