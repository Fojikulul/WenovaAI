import "server-only";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { isSupabaseConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config";

// A Supabase client for server code (pages, server actions, route handlers),
// acting as the signed-in student through their session cookie. Every query
// runs under the Row Level Security policies, so it can only reach that
// student's own rows. Returns null when Supabase isn't set up.
export async function createClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        // Pages can't set cookies, only server actions and route handlers
        // can. That's fine: proxy.ts refreshes the session on every request.
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a page; proxy.ts keeps the session fresh.
        }
      },
    },
  });
}

export type SupabaseServerClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

// The signed-in student and a client for their data, or null if nobody is
// signed in (or Supabase isn't set up). getUser() asks Supabase to confirm
// the session, so a forged cookie never counts as signed in.
export async function getSignedIn(): Promise<{ supabase: SupabaseServerClient; user: User } | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return { supabase, user: data.user };
}
