import Link from "next/link";
import { getProfile } from "@/lib/progress";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSignedIn } from "@/lib/supabase/server";

const base =
  "flex min-h-11 items-center justify-center rounded-lg font-bold whitespace-nowrap transition-colors";

export default async function AccountButton() {
  if (!isSupabaseConfigured) return null;
  const signedIn = await getSignedIn();
  if (!signedIn) {
    return (
      <Link href="/login" className={`${base} px-3 text-primary hover:bg-surface`}>
        Sign in
      </Link>
    );
  }
  const profile = await getProfile(signedIn.supabase, signedIn.user.id);
  const name = profile?.display_name || signedIn.user.email || "";
  return (
    <Link
      href="/settings"
      className={`${base} size-11 rounded-full bg-linear-to-br from-primary to-logo-green text-lg text-on-primary hover:opacity-90`}
    >
      <span aria-hidden="true">{name.charAt(0).toUpperCase() || "?"}</span>
      <span className="sr-only">Settings and account</span>
    </Link>
  );
}
