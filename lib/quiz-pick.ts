import type { PracticeQuestion } from "@/app/lessons/lesson";

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Only called from button clicks, never while the page is drawn, so the server and browser match.
export function pickQuestions(bank: PracticeQuestion[], count: number): PracticeQuestion[] {
  return shuffle(bank)
    .slice(0, count)
    .map((question) => ({ ...question, options: shuffle(question.options) }));
}

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
  const topUp = shuffle(bank.filter((question) => seen.has(questionKey(question)) && !isLead(question))).slice(
    0,
    count - lead.length - unseen.length,
  );
  const chosen = [...lead, ...withShuffledOptions(shuffle([...unseen, ...topUp]))];
  return { chosen, nextSeen: new Set(chosen.map(questionKey)) };
}
