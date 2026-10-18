import lessons from "@/data/lessons.json";

// The allowed "rule" tags are read from data/lessons.json, so the prompt, the
// JSON schema, and the validator always match the lessons the team wrote.
// Adding a lesson to that file makes its id usable everywhere.
export const LESSON_IDS: string[] = lessons.map((lesson) => lesson.id);

export type LessonId = string;

export function isLessonId(value: string): boolean {
  return LESSON_IDS.includes(value);
}
