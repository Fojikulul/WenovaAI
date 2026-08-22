import lessons from "@/data/lessons.json";

export const LESSON_IDS: string[] = lessons.map((lesson) => lesson.id);

export type LessonId = string;

export function isLessonId(value: string): boolean {
  return LESSON_IDS.includes(value);
}
