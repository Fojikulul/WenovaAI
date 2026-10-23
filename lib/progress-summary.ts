import { PASS_SHARE } from "./learning";
import { quizResults, recentMistakes, type ActivityRow } from "./learning-path";

const DAY = 24 * 60 * 60 * 1000;

export type Summary = {
  lessonsPassed: number;
  quizzesTaken: number;
  quizAverage: number | null;
  essaysChecked: number;
  minutesLast7Days: number; // quiz time only; essays aren't timed
  strengths: { lessonId: string; best: number }[];
  recurring: { lessonId: string; mistakes: number; essays: number }[];
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;
const withinWeek = (row: ActivityRow, now: number) => now - Date.parse(row.created_at) < 7 * DAY;
const average = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

export function summarize(activity: ActivityRow[], now = Date.now()): Summary {
  const quizzes = activity.filter((row) => row.activity_type === "quiz_completed" && row.max_score);
  const results = quizResults(activity);
  const weekSeconds = quizzes.filter((row) => withinWeek(row, now)).reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0);

  const recurring = [...recentMistakes(activity).byLesson]
    .filter(([, entry]) => entry.essays >= 2)
    .map(([lessonId, entry]) => ({ lessonId, ...entry }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 3);

  const strengths = [...results]
    .filter(([lessonId, { best }]) => best >= 0.9 && !recurring.some((r) => r.lessonId === lessonId))
    .map(([lessonId, { best }]) => ({ lessonId, best }))
    .sort((a, b) => b.best - a.best)
    .slice(0, 3);

  return {
    lessonsPassed: [...results.values()].filter(({ best }) => best >= PASS_SHARE).length,
    quizzesTaken: quizzes.length,
    quizAverage: average(quizzes.map((row) => (row.score ?? 0) / (row.max_score ?? 1))),
    essaysChecked: activity.filter((row) => row.activity_type === "essay_check").length,
    minutesLast7Days: Math.round(weekSeconds / 60),
    strengths,
    recurring,
  };
}

export function insights(activity: ActivityRow[], summary: Summary, titleOf: (lessonId: string) => string, now = Date.now()) {
  const thisWeek = activity.filter((row) => withinWeek(row, now));
  const passedThisWeek = new Set(
    thisWeek
      .filter((row) => row.activity_type === "quiz_completed" && row.max_score && (row.score ?? 0) / row.max_score >= PASS_SHARE)
      .map((row) => row.reference_id),
  ).size;
  const essaysThisWeek = thisWeek.filter((row) => row.activity_type === "essay_check").length;
  const [strongest] = summary.strengths;
  const [weakest] = summary.recurring;

  return [
    passedThisWeek > 0 && `You passed ${plural(passedThisWeek, "lesson quiz")} in the last 7 days.`,
    essaysThisWeek > 0 && `You checked ${plural(essaysThisWeek, "essay")} in the last 7 days.`,
    strongest && `${titleOf(strongest.lessonId)} looks strong: your best quiz score is ${Math.round(strongest.best * 100)}%.`,
    weakest && `${titleOf(weakest.lessonId)} came up in ${weakest.essays} of your recent essays. Try its lesson before your next essay.`,
  ].filter((line): line is string => Boolean(line));
}

// Runs in the browser so days follow the student's time zone.
export function lastSevenDays(activity: { created_at: string }[], now = new Date()) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const back = 6 - i;
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    return { label: back === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }), date, count: 0 };
  });
  for (const { created_at } of activity) {
    const day = days.find(({ date }) => date.toDateString() === new Date(created_at).toDateString());
    if (day) day.count += 1;
  }
  return days;
}
