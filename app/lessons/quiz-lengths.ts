// Separate from lesson.ts so the client bundle doesn't pull in lessons.json.
export type QuizLengths = { min: number; max: number; start: number };

export function getQuizLengths(questionCount: number): QuizLengths {
  const max = Math.min(questionCount, 10);
  return { min: Math.min(3, max), max, start: Math.min(5, max) };
}
