"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState, useTransition } from "react";
import { Card } from "@/components/AccountPage";
import { dangerButton, inputClass, labelClass, primaryButton, secondaryButton } from "@/components/ui";
import {
  DIFFICULTIES,
  DIFFICULTY_EFFECTS,
  DIFFICULTY_LABELS,
  ENGLISH_LEVELS,
  LEVEL_LABELS,
  WEEKLY_GOAL,
  type Difficulty,
} from "@/lib/learning";
import type { Profile } from "@/lib/progress";
import { deleteAccount, deleteLearningData, saveSettings, signOut, type SettingsState } from "./actions";

const sectionTitle = "text-xl font-semibold";

export default function SettingsForm({
  profile,
  email,
  memberSince,
}: {
  profile: Profile;
  email: string;
  memberSince: string;
}) {
  const [state, saveAction, saving] = useActionState<SettingsState, FormData>(saveSettings, {});
  // Controlled fields: React resets uncontrolled ones to their old defaults after a save.
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [level, setLevel] = useState(profile.english_level ?? "");
  const [weeklyGoal, setWeeklyGoal] = useState(String(profile.weekly_goal_minutes));
  const [difficulty, setDifficulty] = useState<Difficulty>(profile.preferred_difficulty);
  const [dirty, setDirty] = useState(false);

  function cancel() {
    setDisplayName(profile.display_name ?? "");
    setLevel(profile.english_level ?? "");
    setWeeklyGoal(String(profile.weekly_goal_minutes));
    setDifficulty(profile.preferred_difficulty);
    setDirty(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <Card>
        <form
          action={saveAction}
          onChange={() => setDirty(true)}
          onSubmit={() => setDirty(false)}
          className="flex flex-col gap-6"
          noValidate
        >
          <section aria-labelledby="profile-title" className="flex flex-col gap-4">
            <h2 id="profile-title" className={sectionTitle}>
              Profile
            </h2>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className={labelClass}>
                Name to show <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="displayName"
                name="displayName"
                maxLength={40}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="nickname"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="englishLevel" className={labelClass}>
                Your English level
              </label>
              <select
                id="englishLevel"
                name="englishLevel"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
                aria-describedby="level-hint"
                className={inputClass}
              >
                <option value="">Not sure yet</option>
                {ENGLISH_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </option>
                ))}
              </select>
              <p id="level-hint" className="text-muted">
                Where you think you are now. It decides which new lessons your learning path starts
                with.
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="weeklyGoal" className={labelClass}>
                Weekly goal (minutes of quiz practice)
              </label>
              <input
                id="weeklyGoal"
                name="weeklyGoal"
                type="number"
                inputMode="numeric"
                min={WEEKLY_GOAL.min}
                max={WEEKLY_GOAL.max}
                step={5}
                value={weeklyGoal}
                onChange={(event) => setWeeklyGoal(event.target.value)}
                aria-describedby="goal-hint"
                className={`${inputClass} max-w-40`}
              />
              <p id="goal-hint" className="text-muted">
                {WEEKLY_GOAL.min}–{WEEKLY_GOAL.max} minutes. My progress shows how close you are each
                week.
              </p>
            </div>
          </section>

          <fieldset className="flex flex-col gap-3" aria-describedby="difficulty-effect">
            <legend className={`${sectionTitle} mb-3`}>Preferred difficulty</legend>
            <p className="-mt-1 text-muted">
              How challenging you want practice to be. You can change it any time, separately from
              your level.
            </p>
            <div className="grid gap-2 sm:grid-cols-3">
              {DIFFICULTIES.map((option) => (
                <label
                  key={option}
                  className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-2 font-bold transition-colors has-focus-visible:[outline:3px_solid_var(--ring)] ${
                    difficulty === option
                      ? "border-primary bg-surface text-heading"
                      : "border-border text-text hover:border-primary"
                  }`}
                >
                  <input
                    type="radio"
                    name="preferredDifficulty"
                    value={option}
                    checked={difficulty === option}
                    onChange={() => setDifficulty(option)}
                    className="size-5 accent-primary"
                  />
                  {DIFFICULTY_LABELS[option]}
                </label>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={difficulty}
                id="difficulty-effect"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="rounded-lg bg-surface px-4 py-3"
              >
                <strong>What this changes:</strong> {DIFFICULTY_EFFECTS[difficulty]}
              </motion.p>
            </AnimatePresence>
          </fieldset>

          {state.error && (
            <p role="alert" className="rounded-lg bg-mistake-bg px-4 py-3 font-bold text-mistake-text">
              {state.error}
            </p>
          )}
          {state.saved && !dirty && !saving && (
            <p role="status" className="rounded-lg bg-correct-bg px-4 py-3 font-bold text-correct-text">
              Saved. Your learning path is updated.
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button type="submit" disabled={saving} className={`disabled:cursor-wait disabled:opacity-70 ${primaryButton}`}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={cancel} disabled={!dirty || saving} className={`disabled:opacity-50 ${secondaryButton}`}>
              Cancel
            </button>
          </div>
        </form>
      </Card>

      <AccountCard email={email} memberSince={memberSince} />
    </div>
  );
}

function AccountCard({ email, memberSince }: { email: string; memberSince: string }) {
  const [confirming, setConfirming] = useState<"data" | "account" | null>(null);
  const [notice, setNotice] = useState<{ error: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<SettingsState>, doneText: string) {
    startTransition(async () => {
      const result = await action();
      setConfirming(null);
      setNotice(result.error ? { error: true, text: result.error } : { error: false, text: doneText });
    });
  }

  return (
    <Card>
      <section aria-labelledby="account-title" className="flex flex-col gap-4">
        <h2 id="account-title" className={sectionTitle}>
          Account
        </h2>
        <dl className="grid gap-1">
          <dt className="text-muted">Email</dt>
          <dd className="font-bold break-all">{email}</dd>
          <dt className="mt-2 text-muted">Member since</dt>
          <dd className="font-bold">{memberSince}</dd>
        </dl>
        <form action={signOut}>
          <button type="submit" className={`w-full ${secondaryButton}`}>
            Sign out
          </button>
        </form>

        <div className="border-t border-divider pt-4">
          <h3 className="font-bold text-heading">Delete your data</h3>
          <p className="mt-1 text-muted">
            Deleting is permanent. Your progress is never shared, and essays are never saved.
          </p>

          {confirming ? (
            <div role="alertdialog" aria-labelledby="confirm-title" className="mt-3 rounded-lg border-2 border-mistake-line p-4">
              <p id="confirm-title" className="font-bold">
                {confirming === "data"
                  ? "Delete all your progress and your learning path? Your account stays."
                  : "Delete your account and everything saved with it? This can't be undone."}
              </p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    confirming === "data"
                      ? run(deleteLearningData, "Your progress was deleted.")
                      : run(deleteAccount, "")
                  }
                  className={`disabled:cursor-wait disabled:opacity-70 ${dangerButton}`}
                >
                  {pending ? "Deleting…" : "Yes, delete"}
                </button>
                <button type="button" onClick={() => setConfirming(null)} className={secondaryButton}>
                  Keep it
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2">
              <button type="button" onClick={() => setConfirming("data")} className={dangerButton}>
                Delete my progress
              </button>
              <button type="button" onClick={() => setConfirming("account")} className={dangerButton}>
                Delete my account
              </button>
            </div>
          )}
          {notice && (
            <p
              role={notice.error ? "alert" : "status"}
              className={`mt-3 font-bold ${notice.error ? "text-mistake-text" : "text-correct-text"}`}
            >
              {notice.text}
            </p>
          )}
        </div>
      </section>
    </Card>
  );
}
