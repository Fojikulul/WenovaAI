// The numbers and sentences on the My progress page, worked out from the
// student's saved activity only. Nothing is guessed: with no data, each part
// says so instead. Pure functions, so they're easy to test.

import { PASS_SHARE } from "./learning";
import { quizResults, recentMistakes, type ActivityRow } from "./learning-path";

const DAY = 24 * 60 * 60 * 1000;

export type Summary = {
  lessonsPassed: number;
  quizzesTaken: number;
  quizAverage: number | null; // share 0-1, null with no quizzes
  essaysChecked: number;
  // Quiz time in the last 7 days. Only quizzes are timed (start to score),
  // so this is "quiz practice time", never total study time.
  minutesLast7Days: number;
  strengths: { lessonId: string; best: number }[];
  recurring: { lessonId: string; mistakes: number; essays: number }[];
};

export function summarize(activity: ActivityRow[], now = Date.now()): Summary {
  const quizzes = activity.filter((row) => row.activity_type === "quiz_completed" && row.max_score);
  const results = quizResults(activity);
  const shares = quizzes.map((row) => (row.score ?? 0) / (row.max_score ?? 1));
  const weekSeconds = quizzes
    .filter((row) => now - Date.parse(row.created_at) < 7 * DAY)
    .reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0);

  const { byLesson } = recentMistakes(activity);
  const recurring = [...byLesson.entries()]
    .filter(([, entry]) => entry.essays >= 2)
    .map(([lessonId, entry]) => ({ lessonId, ...entry }))
    .sort((a, b) => b.mistakes - a.mistakes)
    .slice(0, 3);
  return {
    lessonsPassed: [...results.values()].filter((result) => result.best >= PASS_SHARE).length,
    quizzesTaken: quizzes.length,
    quizAverage: shares.length ? shares.reduce((a, b) => a + b, 0) / shares.length : null,
    essaysChecked: activity.filter((row) => row.activity_type === "essay_check").length,
    minutesLast7Days: Math.round(weekSeconds / 60),
    // Strong: quizzes passed with 90% or more, best first, as long as the
    // rule isn't also coming up again and again in essays.
    strengths: [...results.entries()]
      .filter(([lessonId, result]) => result.best >= 0.9 && !recurring.some((r) => r.lessonId === lessonId))
      .map(([lessonId, result]) => ({ lessonId, best: result.best }))
      .sort((a, b) => b.best - a.best)
      .slice(0, 3),
    // Recurring: came up in at least 2 of the recent essay checks.
    recurring,
  };
}

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

// Short, true sentences about what's going well and what to practice.
export function insights(
  activity: ActivityRow[],
  summary: Summary,
  titleOf: (lessonId: string) => string,
  now = Date.now(),
): string[] {
  const lines: string[] = [];
  const thisWeek = activity.filter((row) => now - Date.parse(row.created_at) < 7 * DAY);
  const passedThisWeek = new Set(
    thisWeek
      .filter((row) => row.activity_type === "quiz_completed" && row.max_score && (row.score ?? 0) / row.max_score >= PASS_SHARE)
      .map((row) => row.reference_id),
  ).size;
  const essaysThisWeek = thisWeek.filter((row) => row.activity_type === "essay_check").length;

  if (passedThisWeek > 0) lines.push(`You passed ${plural(passedThisWeek, "lesson quiz")} in the last 7 days.`);
  if (essaysThisWeek > 0) lines.push(`You checked ${plural(essaysThisWeek, "essay")} in the last 7 days.`);
  if (summary.strengths[0]) {
    lines.push(`${titleOf(summary.strengths[0].lessonId)} looks strong: your best quiz score is ${Math.round(summary.strengths[0].best * 100)}%.`);
  }
  if (summary.recurring[0]) {
    const top = summary.recurring[0];
    lines.push(
      `${titleOf(top.lessonId)} came up in ${top.essays} of your recent essays. Try its lesson before your next essay.`,
    );
  }
  return lines;
}

// Activity per day for the last 7 days, in the student's own time zone (so
// this runs in the browser). Oldest day first.
export function lastSevenDays(activity: { created_at: string }[], now = new Date()) {
  const days: { label: string; date: Date; count: number }[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    days.push({
      label: back === 0 ? "Today" : date.toLocaleDateString("en-US", { weekday: "short" }),
      date,
      count: 0,
    });
  }
  for (const row of activity) {
    const at = new Date(row.created_at);
    const day = days.find(
      (d) => d.date.getFullYear() === at.getFullYear() && d.date.getMonth() === at.getMonth() && d.date.getDate() === at.getDate(),
    );
    if (day) day.count += 1;
  }
  return days;
}
