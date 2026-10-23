import type { PracticeQuestion } from "@/app/lessons/lesson";

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const shuffleOptions = (questions: PracticeQuestion[]) =>
  questions.map((question) => ({ ...question, options: shuffle(question.options) }));

export function pickQuestions(bank: PracticeQuestion[], count: number): PracticeQuestion[] {
  return shuffleOptions(shuffle(bank).slice(0, count));
}

// Several questions share a prompt ("Choose the correct sentence."), so the answer is part of the key.
export const questionKey = (question: PracticeQuestion) => `${question.question}|${question.answer}`;

const storageKey = (lessonId: string) => `wenova-quiz-seen:${lessonId}`;

export function readSeen(lessonId?: string): Set<string> {
  if (!lessonId) return new Set();
  try {
    const list: unknown = JSON.parse(localStorage.getItem(storageKey(lessonId)) ?? "[]");
    return new Set(Array.isArray(list) ? list.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveSeen(lessonId: string | undefined, seen: Set<string>) {
  if (!lessonId) return;
  try {
    localStorage.setItem(storageKey(lessonId), JSON.stringify([...seen]));
  } catch {
    // Storage unavailable; the in-memory set still prevents repeats.
  }
}

// Unseen questions first. When fewer than `count` are left, a new round starts.
// `first` is the previewed question and keeps its option order.
export function pickFresh(
  bank: PracticeQuestion[],
  count: number,
  seen: Set<string>,
  first?: PracticeQuestion,
): { chosen: PracticeQuestion[]; nextSeen: Set<string> } {
  const lead = first && !seen.has(questionKey(first)) ? [first] : [];
  const leadKeys = new Set(lead.map(questionKey));
  const pool = bank.filter((question) => !leadKeys.has(questionKey(question)));
  const unseen = pool.filter((question) => !seen.has(questionKey(question)));
  const needed = count - lead.length;

  if (unseen.length >= needed) {
    const chosen = [...lead, ...shuffleOptions(shuffle(unseen).slice(0, needed))];
    return { chosen, nextSeen: new Set([...seen, ...chosen.map(questionKey)]) };
  }

  const topUp = shuffle(pool.filter((question) => seen.has(questionKey(question)))).slice(0, needed - unseen.length);
  const chosen = [...lead, ...shuffleOptions(shuffle([...unseen, ...topUp]))];
  return { chosen, nextSeen: new Set(chosen.map(questionKey)) };
}
