import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/lib/supabase/config";

// Runs before each page request (Next.js 16 calls middleware "proxy"). It
// refreshes the student's login session and passes the new cookies on, so
// pages always see a valid session. It never blocks a page: each account
// page checks the session itself.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  // A sign-in code that landed somewhere else: Supabase sends students to
  // the Site URL (the home page) when the return address isn't in its
  // Redirect URLs list. Pass the code on to /auth/confirm so the sign-in
  // still finishes.
  const code = request.nextUrl.searchParams.get("code");
  if (code && request.nextUrl.pathname !== "/auth/confirm") {
    const confirm = new URL("/auth/confirm", request.url);
    confirm.searchParams.set("code", code);
    confirm.searchParams.set("next", "/progress");
    return NextResponse.redirect(confirm);
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Headers that stop a refreshed session from being cached.
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
      },
    },
  });

  // Reading the claims refreshes an expired session when needed.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Skip static files and images; they don't need a session.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)"],
};
