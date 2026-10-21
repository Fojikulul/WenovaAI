"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type AuthState = {
  error?: string;
  // Set after sign-up when Supabase sends a confirmation email.
  checkEmail?: string;
  // What the student typed, so a failed try doesn't empty the form.
  email?: string;
  displayName?: string;
};

const NOT_SET_UP = "Accounts aren't set up on this copy of Wenova yet.";
const TRY_AGAIN = "Something went wrong. Please try again.";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only paths inside Wenova, so a link can't send the student to another site
// after signing in ("//evil.com" is another site, so it's refused too).
function safeNext(value: FormDataEntryValue | null) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : "/progress";
}

// This site's address, so Supabase sends the student back here.
async function siteOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  if (!host) return "";
  const protocol = headerList.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

function text(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function signIn(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = text(form, "email");
  const password = form.get("password");
  if (!EMAIL_PATTERN.test(email) || typeof password !== "string" || password === "") {
    return { error: "Enter your email and password.", email };
  }
  const supabase = await createClient();
  if (!supabase) return { error: NOT_SET_UP, email };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Same message whether the email exists or not, so the form can't be
    // used to find out who has an account.
    if (error.code === "email_not_confirmed") {
      return { error: "Please confirm your email first. Check your inbox for the link.", email };
    }
    if (error.code === "invalid_credentials") {
      return { error: "That email and password don't match. Please try again.", email };
    }
    return { error: TRY_AGAIN, email };
  }
  redirect(safeNext(form.get("next")));
}

export async function signUp(_state: AuthState, form: FormData): Promise<AuthState> {
  const email = text(form, "email");
  const displayName = text(form, "displayName").slice(0, 40);
  const password = form.get("password");
  const keep = { email, displayName };

  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address.", ...keep };
  if (typeof password !== "string" || password.length < 8) {
    return { error: "Use a password with at least 8 characters.", ...keep };
  }
  if (password.length > 72) return { error: "Use a password with 72 characters or fewer.", ...keep };
  if (form.get("agree") !== "yes") {
    return { error: "Please confirm you are 13 or older and agree to the Terms and Privacy Policy.", ...keep };
  }

  const supabase = await createClient();
  if (!supabase) return { error: NOT_SET_UP, ...keep };

  // The confirmation link comes back to this site.
  const origin = await siteOrigin();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Read by the database trigger that makes the profile row.
      data: displayName ? { display_name: displayName } : {},
      emailRedirectTo: origin ? `${origin}/auth/confirm?next=/progress` : undefined,
    },
  });
  if (error) {
    if (error.code === "weak_password") return { error: "Please choose a stronger password.", ...keep };
    if (error.code === "over_email_send_rate_limit") {
      return { error: "Too many sign-ups right now. Please try again in a few minutes.", ...keep };
    }
    return { error: TRY_AGAIN, ...keep };
  }
  // Email confirmation switched off in Supabase: signed in already.
  if (data.session) redirect("/progress");
  return { checkEmail: email };
}

// "Continue with Google": sends the student to Google, which sends them back
// to /auth/confirm with a one-time code (the same route as email links).
// Signing in with Google for the first time creates the account; the button
// says that continuing means they're 13+ and agree to the Terms and Privacy
// Policy.
export async function signInWithGoogle(_state: AuthState, form: FormData): Promise<AuthState> {
  const supabase = await createClient();
  if (!supabase) return { error: NOT_SET_UP };
  const origin = await siteOrigin();
  const next = safeNext(form.get("next"));
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(next)}` },
  });
  if (error || !data.url) {
    if (error?.code === "validation_failed" || error?.message.includes("provider is not enabled")) {
      return { error: "Google sign-in isn't switched on yet. Use email and password for now." };
    }
    return { error: TRY_AGAIN };
  }
  redirect(data.url);
}
