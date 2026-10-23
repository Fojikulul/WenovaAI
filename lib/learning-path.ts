import { DIFFICULTY_LABELS, lessonDifficulty, PASS_SHARE, type Difficulty, type EnglishLevel } from "./learning";

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
export type PathItem = { lessonId: string; status: PathStatus; reason: string };
export type LessonRef = { id: string; title: string };
export type PathPreferences = { englishLevel: EnglishLevel | null; preferredDifficulty: Difficulty };

const RECENT_ESSAYS = 10;
const MAX_ITEMS = 5;
const FILL_TO = 3;
const DIFFICULTY_ORDER: Difficulty[] = ["beginner", "intermediate", "advanced"];

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? "" : "s"}`;

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
      byLesson.set(lessonId, { mistakes: entry.mistakes + count, essays: entry.essays + 1 });
    }
  }
  return { essaysChecked: essays.length, byLesson };
}

export function quizResults(activity: ActivityRow[]) {
  const byLesson = new Map<string, { best: number; bestScore: number; bestMax: number; attempts: number }>();
  for (const { activity_type, reference_id, score, max_score } of activity) {
    if (activity_type !== "quiz_completed" || !reference_id || score === null || !max_score) continue;
    const share = score / max_score;
    const entry = byLesson.get(reference_id);
    const isBest = !entry || share > entry.best;
    byLesson.set(reference_id, {
      best: isBest ? share : entry.best,
      bestScore: isBest ? score : entry.bestScore,
      bestMax: isBest ? max_score : entry.bestMax,
      attempts: (entry?.attempts ?? 0) + 1,
    });
  }
  return byLesson;
}

// English level sets the base; preferred difficulty shifts it one step.
export function targetDifficulty({ englishLevel, preferredDifficulty }: PathPreferences): Difficulty {
  if (!englishLevel) return preferredDifficulty;
  const base = englishLevel === "beginner" || englishLevel === "elementary" ? 0 : englishLevel === "advanced" ? 2 : 1;
  const shift = preferredDifficulty === "beginner" ? -1 : preferredDifficulty === "advanced" ? 1 : 0;
  return DIFFICULTY_ORDER[Math.max(0, Math.min(2, base + shift))];
}

// Priority: essay mistakes in unpassed lessons, unpassed quizzes, passed lessons that still
// show up in essays, then new lessons nearest the target difficulty.
export function buildLearningPath(lessons: LessonRef[], activity: ActivityRow[], preferences: PathPreferences): PathItem[] {
  const known = new Set(lessons.map((lesson) => lesson.id));
  const order = new Map(lessons.map((lesson, index) => [lesson.id, index]));
  const { byLesson: mistakes } = recentMistakes(activity);
  const quizzes = quizResults(activity);
  const target = DIFFICULTY_ORDER.indexOf(targetDifficulty(preferences));

  const distance = (id: string) => Math.abs(DIFFICULTY_ORDER.indexOf(lessonDifficulty(id)) - target);
  const byOrder = (a: string, b: string) => (order.get(a) ?? 0) - (order.get(b) ?? 0);
  const passed = (id: string) => (quizzes.get(id)?.best ?? 0) >= PASS_SHARE;
  const statusOf = (id: string): PathStatus => (passed(id) ? "completed" : quizzes.has(id) ? "in_progress" : "recommended");
  const where = ({ mistakes, essays }: { mistakes: number; essays: number }) =>
    `${plural(mistakes, "mistake")} in ${plural(essays, "recent essay")}`;

  const items: PathItem[] = [];
  const add = (lessonId: string, reason: string) => {
    if (items.length < MAX_ITEMS && !items.some((item) => item.lessonId === lessonId)) {
      items.push({ lessonId, status: statusOf(lessonId), reason });
    }
  };

  const fromEssays = [...mistakes]
    .filter(([id]) => known.has(id))
    .sort(([a, ea], [b, eb]) => eb.mistakes - ea.mistakes || distance(a) - distance(b) || byOrder(a, b));

  for (const [id, entry] of fromEssays) {
    if (!passed(id)) add(id, `This rule came up in your writing: ${where(entry)}.`);
  }
  for (const [id, result] of quizzes) {
    if (known.has(id) && result.best < PASS_SHARE) {
      add(id, `Your best quiz score is ${result.bestScore} of ${result.bestMax}. Try it again to pass (75%).`);
    }
  }
  for (const [id, entry] of fromEssays) {
    if (passed(id) && entry.mistakes >= 2) add(id, `You passed the quiz, but this rule still came up: ${where(entry)}.`);
  }

  const fresh = lessons.filter(({ id }) => !quizzes.has(id)).sort((a, b) => distance(a.id) - distance(b.id) || byOrder(a.id, b.id));
  for (const { id } of fresh) {
    if (items.length >= FILL_TO) break;
    const level = DIFFICULTY_LABELS[lessonDifficulty(id)].toLowerCase();
    const article = level === "beginner" ? "a" : "an";
    add(
      id,
      activity.length === 0
        ? `${article === "a" ? "A" : "An"} ${level} lesson to start with, picked from your level and chosen difficulty.`
        : `Next up: ${article} ${level} lesson that fits your level and chosen difficulty.`,
    );
  }

  return items;
}
