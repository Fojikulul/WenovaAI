// Its own file, not in lesson.ts: the quiz runs in the browser, and importing lesson.ts there
// would send all of data/lessons.json along with it.
export type QuizLengths = { min: number; max: number; start: number };

export function getQuizLengths(questionCount: number): QuizLengths {
  const max = Math.min(questionCount, 10);
  return { min: Math.min(3, max), max, start: Math.min(5, max) };
}
