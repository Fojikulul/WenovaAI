import {
  DIFFICULTY_LABELS,
  lessonDifficulty,
  PASS_SHARE,
  type Difficulty,
  type EnglishLevel,
} from "./learning";

export type ActivityRow = {
  id: string;
  activity_type: "essay_check" | "quiz_completed";
  reference_id: string | null;
  score: number | null;
  max_score: number | null;
  duration_seconds: number | null;
  mistake_counts: Record<string, number> | null;
  created_at: string;
};

export type PathStatus = "recommended" | "in_progress" | "completed";

export type PathItem = {
  lessonId: string;
  status: PathStatus;
  reason: string;
};

export type LessonRef = { id: string; title: string };

export type PathPreferences = {
  englishLevel: EnglishLevel | null;
  preferredDifficulty: Difficulty;
};

const RECENT_ESSAYS = 10;
const MAX_ITEMS = 5;
const FILL_TO = 3;
const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function recentMistakes(activity: ActivityRow[]) {
  const essays = activity
    .filter((row) => row.activity_type === "essay_check")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, RECENT_ESSAYS);
  const byLesson = new Map<string, { mistakes: number; essays: number }>();
  for (const essay of essays) {
    for (const [lessonId, count] of Object.entries(essay.mistake_counts ?? {})) {
      if (lessonId === "other" || !(count > 0)) continue;
      const entry = byLesson.get(lessonId) ?? { mistakes: 0, essays: 0 };
      entry.mistakes += count;
      entry.essays += 1;
      byLesson.set(lessonId, entry);
    }
  }
  return { essaysChecked: essays.length, byLesson };
}

export function quizResults(activity: ActivityRow[]) {
  const byLesson = new Map<string, { best: number; bestScore: number; bestMax: number; attempts: number }>();
  for (const row of activity) {
    if (row.activity_type !== "quiz_completed" || !row.reference_id) continue;
    if (row.score === null || !row.max_score) continue;
    const share = row.score / row.max_score;
    const entry = byLesson.get(row.reference_id);
    if (!entry) {
      byLesson.set(row.reference_id, { best: share, bestScore: row.score, bestMax: row.max_score, attempts: 1 });
    } else {
      entry.attempts += 1;
      if (share > entry.best) {
        entry.best = share;
        entry.bestScore = row.score;
        entry.bestMax = row.max_score;
      }
    }
  }
  return byLesson;
}

export function targetDifficulty({ englishLevel, preferredDifficulty }: PathPreferences): Difficulty {
  if (!englishLevel) return preferredDifficulty;
  const base =
    englishLevel === "beginner" || englishLevel === "elementary"
      ? 0
      : englishLevel === "advanced"
        ? 2
        : 1;
  const shift = preferredDifficulty === "beginner" ? -1 : preferredDifficulty === "advanced" ? 1 : 0;
  return DIFFICULTY_ORDER[Math.max(0, Math.min(2, base + shift))];
}

export function buildLearningPath(
  lessons: LessonRef[],
  activity: ActivityRow[],
  preferences: PathPreferences,
): PathItem[] {
  const known = new Set(lessons.map((lesson) => lesson.id));
  const { byLesson: mistakes } = recentMistakes(activity);
  const quizzes = quizResults(activity);
  const target = targetDifficulty(preferences);
  const distance = (lessonId: string) =>
    Math.abs(DIFFICULTY_ORDER.indexOf(lessonDifficulty(lessonId)) - DIFFICULTY_ORDER.indexOf(target));
  const listOrder = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  const passed = (lessonId: string) => (quizzes.get(lessonId)?.best ?? 0) >= PASS_SHARE;
  const statusOf = (lessonId: string): PathStatus =>
    passed(lessonId) ? "completed" : quizzes.has(lessonId) ? "in_progress" : "recommended";

  const items: PathItem[] = [];
  const added = new Set<string>();
  const add = (lessonId: string, reason: string) => {
    if (added.has(lessonId) || items.length >= MAX_ITEMS) return;
    added.add(lessonId);
    items.push({ lessonId, status: statusOf(lessonId), reason });
  };

  const fromEssays = [...mistakes.entries()]
    .filter(([lessonId]) => known.has(lessonId))
    .sort(
      ([a, ea], [b, eb]) =>
        eb.mistakes - ea.mistakes ||
        distance(a) - distance(b) ||
        (listOrder.get(a) ?? 0) - (listOrder.get(b) ?? 0),
    );
  const where = (entry: { mistakes: number; essays: number }) =>
    `${plural(entry.mistakes, "mistake")} in ${plural(entry.essays, "recent essay")}`;

  for (const [lessonId, entry] of fromEssays) {
    if (!passed(lessonId)) add(lessonId, `This rule came up in your writing: ${where(entry)}.`);
  }

  for (const [lessonId, result] of quizzes) {
    if (!known.has(lessonId) || result.best >= PASS_SHARE) continue;
    add(lessonId, `Your best quiz score is ${result.bestScore} of ${result.bestMax}. Try it again to pass (75%).`);
  }

  for (const [lessonId, entry] of fromEssays) {
    if (passed(lessonId) && entry.mistakes >= 2) {
      add(lessonId, `You passed the quiz, but this rule still came up: ${where(entry)}.`);
    }
  }

  const fresh = lessons
    .filter((lesson) => !quizzes.has(lesson.id))
    .sort(
      (a, b) =>
        distance(a.id) - distance(b.id) || (listOrder.get(a.id) ?? 0) - (listOrder.get(b.id) ?? 0),
    );
  const nothingYet = activity.length === 0;
  for (const lesson of fresh) {
    if (items.length >= FILL_TO) break;
    const level = DIFFICULTY_LABELS[lessonDifficulty(lesson.id)].toLowerCase();
    const aLevel = `${level === "beginner" ? "a" : "an"} ${level}`;
    add(
      lesson.id,
      nothingYet
        ? `${aLevel[0].toUpperCase()}${aLevel.slice(1)} lesson to start with, picked from your level and chosen difficulty.`
        : `Next up: ${aLevel} lesson that fits your level and chosen difficulty.`,
    );
  }

  return items;
}
