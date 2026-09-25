import type { Metadata } from "next";
import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { getLessonCards } from "@/app/lessons/lesson";
import { AccountPage, Card, NotConfigured, SignInPrompt } from "@/components/AccountPage";
import { primaryButton, secondaryButton, textLink } from "@/components/ui";
import { DIFFICULTY_LABELS, lessonDifficulty } from "@/lib/learning";
import { buildLearningPath, type ActivityRow, type PathStatus } from "@/lib/learning-path";
import { getActivity, getLearningPath, getProfile } from "@/lib/progress";
import { insights, summarize } from "@/lib/progress-summary";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSignedIn } from "@/lib/supabase/server";
import WeeklyChart from "./WeeklyChart";

export const metadata: Metadata = { title: "My progress - Wenova" };

export default function ProgressPage() {
  return (
    <AccountPage title="My progress" intro="What you've practiced, and what to practice next.">
      <Suspense fallback={<p className="text-center text-muted">Loading your progress…</p>}>
        <ProgressContent />
      </Suspense>
    </AccountPage>
  );
}

const sectionTitle = "text-xl font-semibold";

async function ProgressContent() {
  if (!isSupabaseConfigured) return <NotConfigured />;
  const signedIn = await getSignedIn();
  if (!signedIn) {
    return (
      <SignInPrompt
        next="/progress"
        reason="Create a free account to save your essay checks and quiz scores, and get a learning path made for you."
      />
    );
  }
  const { supabase, user } = signedIn;
  const [profile, activity, storedPath] = await Promise.all([
    getProfile(supabase, user.id),
    getActivity(supabase),
    getLearningPath(supabase),
  ]);
  if (!activity) {
    return (
      <Card className="mx-auto max-w-[560px] text-center">
        <h2 className="text-xl font-semibold">We couldn&apos;t load your progress</h2>
        <p className="mt-2">Please reload the page in a moment.</p>
      </Card>
    );
  }

  const cards = getLessonCards();
  const titleOf = (id: string) => cards.find((card) => card.id === id)?.title ?? id;
  const summary = summarize(activity);
  const lines = insights(activity, summary, titleOf);
  const goal = profile?.weekly_goal_minutes ?? 60;
  const path =
    storedPath && storedPath.length > 0
      ? storedPath.map((item) => ({ lessonId: item.lesson_id, status: item.status, reason: item.reason }))
      : buildLearningPath(
          cards.map((card) => ({ id: card.id, title: card.title })),
          activity,
          {
            englishLevel: profile?.english_level ?? null,
            preferredDifficulty: profile?.preferred_difficulty ?? "intermediate",
          },
        );
  const empty = activity.length === 0;
  const name = profile?.display_name;

  return (
    <div className="flex flex-col gap-6">
      {name && <p className="-mt-2 text-center text-lg">Welcome back, {name}!</p>}

      {empty && (
        <Card className="text-center">
          <h2 className={sectionTitle}>Your progress starts here</h2>
          <p className="mx-auto mt-2 max-w-[60ch]">
            Check an essay or finish a lesson quiz while signed in, and your numbers, insights and
            learning path will show up here. Only mistake types and scores are saved, never your
            writing.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/" className={primaryButton}>
              Check an essay
            </Link>
            <Link href="/lessons" className={secondaryButton}>
              Browse lessons
            </Link>
          </div>
        </Card>
      )}

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Overview">
        <Stat
          label="Lessons passed"
          value={`${summary.lessonsPassed}`}
          note={`of ${cards.length}`}
          delay={0}
        />
        <Stat
          label="Quiz average"
          value={summary.quizAverage === null ? "—" : `${Math.round(summary.quizAverage * 100)}%`}
          note={summary.quizzesTaken === 0 ? "No quizzes yet" : `over ${plural(summary.quizzesTaken, "quiz", "quizzes")}`}
          delay={60}
        />
        <Stat label="Essays checked" value={`${summary.essaysChecked}`} note="last 90 days" delay={120} />
        <Stat label="Quiz practice" value={`${summary.minutesLast7Days} min`} note="last 7 days" delay={180} />
      </ul>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <section aria-labelledby="path-title">
              <h2 id="path-title" className={sectionTitle}>
                Your Learning Path
              </h2>
              <p className="mt-1 text-muted">
                Picked from your essay mistakes, quiz scores, level and{" "}
                <Link href="/settings" className={textLink}>
                  chosen difficulty
                </Link>
                .
              </p>
              <ol className="mt-4 flex flex-col gap-3">
                {path.map((item, index) => (
                  <PathRow key={item.lessonId} number={index + 1} title={titleOf(item.lessonId)} {...item} />
                ))}
              </ol>
            </section>
          </Card>

          <Card>
            <section aria-labelledby="recent-title">
              <h2 id="recent-title" className={sectionTitle}>
                Recent activity
              </h2>
              {empty ? (
                <p className="mt-2 text-muted">Nothing yet. Your essay checks and quizzes will be listed here.</p>
              ) : (
                <ul className="mt-3">
                  {activity.slice(0, 8).map((row) => (
                    <li key={row.id} className="flex items-baseline justify-between gap-3 border-b border-divider py-3 last:border-b-0">
                      <span>{describe(row, titleOf)}</span>
                      <span className="shrink-0 text-sm text-muted">{timeAgo(row.created_at)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <section aria-labelledby="week-title">
              <h2 id="week-title" className={sectionTitle}>
                This week
              </h2>
              <GoalBar minutes={summary.minutesLast7Days} goal={goal} />
              <h3 className="mt-6 font-bold text-heading">Activities per day</h3>
              <div className="mt-3">
                <WeeklyChart timestamps={activity.map((row) => row.created_at)} />
              </div>
            </section>
          </Card>

          <Card>
            <section aria-labelledby="insights-title">
              <h2 id="insights-title" className={sectionTitle}>
                Insights
              </h2>
              {lines.length === 0 ? (
                <p className="mt-2 text-muted">
                  Insights appear after a few essay checks or quizzes. They only describe what
                  you&apos;ve actually done.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col gap-2">
                  {lines.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span aria-hidden="true" className="mt-[calc(0.8em-0.25rem)] size-2 shrink-0 rounded-full bg-logo-green" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              )}

              {(summary.strengths.length > 0 || summary.recurring.length > 0) && (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <h3 className="font-bold text-correct-text">Strong rules</h3>
                    <TagList empty="Pass a quiz with 90%+ to see it here." items={summary.strengths.map((s) => titleOf(s.lessonId))} />
                  </div>
                  <div>
                    <h3 className="font-bold text-hint-text">Keeps coming up</h3>
                    <TagList empty="Nothing repeats in your recent essays." items={summary.recurring.map((r) => titleOf(r.lessonId))} />
                  </div>
                </div>
              )}
            </section>
          </Card>
        </div>
      </div>

      <p className="text-center text-sm text-muted">
        Essay scores are practice estimates from Wenova&apos;s AI coach, not official English
        grades.
      </p>
    </div>
  );
}

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

function Stat({ label, value, note, delay }: { label: string; value: string; note: string; delay: number }) {
  return (
    <li
      className="animate-fade-up rounded-2xl border border-divider bg-background p-4 shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-muted">{label}</p>
      <p className="mt-1 font-heading text-3xl font-bold text-heading tabular-nums">{value}</p>
      <p className="text-sm text-muted">{note}</p>
    </li>
  );
}

const STATUS: Record<PathStatus, { label: string; action: string; className: string }> = {
  recommended: { label: "Recommended", action: "Start lesson", className: "bg-surface text-heading" },
  in_progress: { label: "In progress", action: "Continue", className: "bg-hint-bg text-hint-text" },
  completed: { label: "Passed", action: "Review", className: "bg-correct-bg text-correct-text" },
};

function PathRow({
  number,
  title,
  lessonId,
  status,
  reason,
}: {
  number: number;
  title: string;
  lessonId: string;
  status: PathStatus;
  reason: string;
}) {
  const info = STATUS[status];
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-divider p-4 sm:flex-row sm:items-center">
      <span
        aria-hidden="true"
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-primary to-logo-green font-bold text-on-primary"
      >
        {number}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-heading text-lg font-semibold text-heading">{title}</span>
          <span className="rounded-full bg-tag-bg px-2 py-0.5 text-sm font-bold text-tag-text">
            {DIFFICULTY_LABELS[lessonDifficulty(lessonId)]}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-sm font-bold ${info.className}`}>{info.label}</span>
        </p>
        <p className="mt-1 text-muted">{reason}</p>
      </div>
      <Link href={`/lessons/${lessonId}#practice-title`} className={`shrink-0 ${status === "recommended" ? primaryButton : secondaryButton}`}>
        {info.action}
        <span className="sr-only">: {title}</span>
      </Link>
    </li>
  );
}

function GoalBar({ minutes, goal }: { minutes: number; goal: number }) {
  const share = Math.min(1, minutes / goal);
  return (
    <div className="mt-3">
      <p>
        <strong className="font-heading text-2xl text-heading tabular-nums">{minutes}</strong> of {goal}{" "}
        minutes of quiz practice
        {minutes >= goal && <span className="font-bold text-correct-text"> · Goal reached!</span>}
      </p>
      <div
        role="progressbar"
        aria-label="Weekly goal"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={Math.min(minutes, goal)}
        className="mt-2 h-3 overflow-hidden rounded-full bg-divider"
      >
        <div
          className="h-full origin-left animate-grow rounded-full bg-linear-to-r from-primary to-logo-green"
          style={{ width: `${share * 100}%` }}
        />
      </div>
      <p className="mt-1 text-sm text-muted">
        Last 7 days. Change your goal in <Link href="/settings" className={textLink}>Settings</Link>.
      </p>
    </div>
  );
}

function TagList({ items, empty }: { items: string[]; empty: string }): ReactNode {
  if (items.length === 0) return <p className="mt-1 text-sm text-muted">{empty}</p>;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item} className="rounded-full bg-surface px-3 py-1 font-bold">
          {item}
        </li>
      ))}
    </ul>
  );
}

function describe(row: ActivityRow, titleOf: (id: string) => string) {
  if (row.activity_type === "quiz_completed") {
    return `Quiz: ${titleOf(row.reference_id ?? "")}, ${row.score} of ${row.max_score} right`;
  }
  const mistakes = Object.values(row.mistake_counts ?? {}).reduce((a, b) => a + b, 0);
  const estimate = row.score !== null ? ` · estimate ${row.score.toFixed(1)}/5` : "";
  return `Essay check: ${plural(mistakes, "thing")} to fix${estimate}`;
}

function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}
