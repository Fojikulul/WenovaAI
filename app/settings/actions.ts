"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { DIFFICULTIES, ENGLISH_LEVELS, WEEKLY_GOAL } from "@/lib/learning";
import { refreshLearningPath } from "@/lib/progress";
import { createClient, getSignedIn } from "@/lib/supabase/server";

export type SettingsState = { error?: string; saved?: boolean };

const SIGNED_OUT = "You're signed out. Please sign in again.";
const TRY_AGAIN = "We couldn't save that. Please try again.";

export async function saveSettings(_state: SettingsState, form: FormData): Promise<SettingsState> {
  const signedIn = await getSignedIn();
  if (!signedIn) return { error: SIGNED_OUT };

  const rawName = form.get("displayName");
  const displayName = typeof rawName === "string" ? rawName.trim() : "";
  const level = form.get("englishLevel");
  const difficulty = form.get("preferredDifficulty");
  const goal = Number(form.get("weeklyGoal"));

  if (displayName.length > 40) return { error: "Use a name with 40 characters or fewer." };
  if (level !== "" && !(ENGLISH_LEVELS as readonly unknown[]).includes(level)) {
    return { error: "Pick an English level from the list." };
  }
  if (!(DIFFICULTIES as readonly unknown[]).includes(difficulty)) {
    return { error: "Pick a difficulty." };
  }
  if (!Number.isInteger(goal) || goal < WEEKLY_GOAL.min || goal > WEEKLY_GOAL.max) {
    return { error: `Set a weekly goal between ${WEEKLY_GOAL.min} and ${WEEKLY_GOAL.max} minutes.` };
  }

  const { supabase, user } = signedIn;
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName === "" ? null : displayName,
      english_level: level === "" ? null : level,
      preferred_difficulty: difficulty,
      weekly_goal_minutes: goal,
    })
    .eq("id", user.id);
  if (error) {
    console.error(`Supabase settings save failed: ${error.message}`);
    return { error: TRY_AGAIN };
  }
  await refreshLearningPath(supabase, user.id);
  revalidatePath("/progress");
  revalidatePath("/settings");
  return { saved: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase?.auth.signOut();
  redirect("/");
}

export async function deleteLearningData(): Promise<SettingsState> {
  const signedIn = await getSignedIn();
  if (!signedIn) return { error: SIGNED_OUT };
  const { supabase, user } = signedIn;
  const [activity, path] = await Promise.all([
    supabase.from("learning_activity").delete().eq("user_id", user.id),
    supabase.from("learning_path_items").delete().eq("user_id", user.id),
  ]);
  const error = activity.error ?? path.error;
  if (error) {
    console.error(`Supabase data delete failed: ${error.message}`);
    return { error: "We couldn't delete your data. Please try again." };
  }
  revalidatePath("/progress");
  return { saved: true };
}

// delete_my_account() can only delete the caller's own account.
export async function deleteAccount(): Promise<SettingsState> {
  const signedIn = await getSignedIn();
  if (!signedIn) return { error: SIGNED_OUT };
  const { error } = await signedIn.supabase.rpc("delete_my_account");
  if (error) {
    console.error(`Supabase account delete failed: ${error.message}`);
    return { error: "We couldn't delete your account. Please try again." };
  }
  await signedIn.supabase.auth.signOut();
  redirect("/");
}
