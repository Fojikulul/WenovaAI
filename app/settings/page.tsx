import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPage, Card, NotConfigured, SignInPrompt } from "@/components/AccountPage";
import { getProfile } from "@/lib/progress";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSignedIn } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = { title: "Settings - Wenova" };

// Profile, learning preferences and account. Needs an account.
export default function SettingsPage() {
  return (
    <AccountPage title="Settings" intro="Your profile, how hard practice should be, and your account.">
      <Suspense fallback={<p className="text-center text-muted">Loading your settings…</p>}>
        <SettingsContent />
      </Suspense>
    </AccountPage>
  );
}

async function SettingsContent() {
  if (!isSupabaseConfigured) return <NotConfigured />;
  const signedIn = await getSignedIn();
  if (!signedIn) {
    return <SignInPrompt next="/settings" reason="Settings are saved to your account." />;
  }
  const { supabase, user } = signedIn;
  const profile = await getProfile(supabase, user.id);
  if (!profile) {
    return (
      <Card className="mx-auto max-w-[560px] text-center">
        <h2 className="text-xl font-semibold">We couldn&apos;t load your settings</h2>
        <p className="mt-2">Please reload the page. If it keeps happening, sign out and back in.</p>
      </Card>
    );
  }
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  return <SettingsForm profile={profile} email={user.email ?? ""} memberSince={memberSince} />;
}
