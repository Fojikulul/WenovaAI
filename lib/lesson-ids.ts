import lessons from "@/data/lessons.json";

// Derived from lessons.json so the prompt, schema and validator stay in sync.
export const LESSON_IDS: string[] = lessons.map((lesson) => lesson.id);

export type LessonId = string;

export const isLessonId = (value: string): boolean => LESSON_IDS.includes(value);
