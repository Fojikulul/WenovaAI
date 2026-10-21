import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AccountPage, Card, NotConfigured } from "@/components/AccountPage";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getSignedIn } from "@/lib/supabase/server";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "Sign in - Wenova" };

// Sign in or create an account. Accounts are optional: they save progress
// and unlock My progress and Settings. For ages 13 and up.
export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AccountPage
      title="Your Wenova account"
      intro="Save your progress and get lessons picked for you. For students 13 and older."
      width="narrow"
    >
      <Suspense fallback={<p className="text-center text-muted">Loading…</p>}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AccountPage>
  );
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  if (!isSupabaseConfigured) return <NotConfigured />;

  const params = await searchParams;
  const nextParam = typeof params.next === "string" ? params.next : "";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/progress";

  // Already signed in: go straight on.
  if (await getSignedIn()) redirect(next);

  const failed = params.error === "confirm";
  return (
    <Card>
      {failed && (
        <p role="alert" className="mb-5 rounded-lg bg-hint-bg px-4 py-3 font-bold text-hint-text">
          That confirmation link didn&apos;t work. It may have expired, or been opened on another
          device. Try signing in, or create your account again.
        </p>
      )}
      <LoginForm next={next} startMode={params.mode === "signup" ? "signup" : "signin"} />
    </Card>
  );
}
