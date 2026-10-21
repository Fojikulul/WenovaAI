import type { PracticeQuestion } from "@/app/lessons/lesson";

// Picking quiz questions: random sets, shuffled options, and unseen
// questions first. Used by components/Quiz.tsx; kept here (no React) so it
// can be tested on its own.

// A shuffled copy of a list (Fisher–Yates: every order is equally likely).
export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// `count` random questions from the lesson, in random order, each with its
// options shuffled. Answers are still checked by text, so the order doesn't
// matter. Only called from button clicks, never while the page is drawn, so
// the server and the browser always draw the same first screen.
export function pickQuestions(bank: PracticeQuestion[], count: number): PracticeQuestion[] {
  return shuffle(bank)
    .slice(0, count)
    .map((question) => ({ ...question, options: shuffle(question.options) }));
}

// The questions this device has already had in the current round, per
// lesson, so "Try again" (or coming back another day) brings new questions
// first. Only the question texts are kept, in this browser (localStorage);
// nothing about the student. If storage is blocked it still works for as
// long as the page stays open.
// One question's id: its text plus its answer, because several questions
// share a prompt like "Choose the correct sentence."
export function questionKey(question: PracticeQuestion) {
  return `${question.question}|${question.answer}`;
}

function seenKey(lessonId: string) {
  return `wenova-quiz-seen:${lessonId}`;
}

export function readSeen(lessonId: string | undefined): Set<string> {
  if (!lessonId) return new Set();
  try {
    const list: unknown = JSON.parse(localStorage.getItem(seenKey(lessonId)) ?? "[]");
    return new Set(Array.isArray(list) ? list.filter((item) => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveSeen(lessonId: string | undefined, seen: Set<string>) {
  if (!lessonId) return;
  try {
    localStorage.setItem(seenKey(lessonId), JSON.stringify([...seen]));
  } catch {
    // Storage blocked: the in-page memory still avoids repeats.
  }
}

// `count` questions, ones not seen yet first. With 20 questions and at most
// 10 per quiz, two quizzes in a row never share a question. When fewer than
// `count` unseen ones are left, it uses all of them, tops up with seen ones,
// and a new round starts. `first` (the blurred preview) goes first when it
// hasn't been seen, with its options in the order the preview showed.
export function pickFresh(
  bank: PracticeQuestion[],
  count: number,
  seen: Set<string>,
  first?: PracticeQuestion,
): { chosen: PracticeQuestion[]; nextSeen: Set<string> } {
  const lead = first && !seen.has(questionKey(first)) ? [first] : [];
  const isLead = (question: PracticeQuestion) => lead.some((item) => questionKey(item) === questionKey(question));
  const unseen = bank.filter((question) => !seen.has(questionKey(question)) && !isLead(question));
  const withShuffledOptions = (list: PracticeQuestion[]) =>
    list.map((question) => ({ ...question, options: shuffle(question.options) }));

  if (lead.length + unseen.length >= count) {
    const rest = shuffle(unseen).slice(0, count - lead.length);
    const chosen = [...lead, ...withShuffledOptions(rest)];
    return { chosen, nextSeen: new Set([...seen, ...chosen.map(questionKey)]) };
  }
  // Not enough new ones left: all of them, plus some seen ones, as a new round.
  const topUp = shuffle(bank.filter((question) => seen.has(questionKey(question)) && !isLead(question))).slice(
    0,
    count - lead.length - unseen.length,
  );
  const chosen = [...lead, ...withShuffledOptions(shuffle([...unseen, ...topUp]))];
  return { chosen, nextSeen: new Set(chosen.map(questionKey)) };
}
