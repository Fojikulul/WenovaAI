// How many questions a student can pick for one quiz: from 3 up to the
// number the lesson has (at most 10), starting at 5. A lesson with 3 or
// fewer questions always uses all of them.
// This is its own file (not in lesson.ts) because the quiz runs in the
// browser, and importing lesson.ts there would send all of
// data/lessons.json along with it.
export type QuizLengths = { min: number; max: number; start: number };

export function getQuizLengths(questionCount: number): QuizLengths {
  const max = Math.min(questionCount, 10);
  return { min: Math.min(3, max), max, start: Math.min(5, max) };
}
