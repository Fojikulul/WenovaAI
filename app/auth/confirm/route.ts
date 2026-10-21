import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Where the sign-up confirmation email's link lands. Supabase's default
// email sends a one-time `code`; a customized email template can send
// `token_hash` and `type` instead (see docs/SUPABASE_SETUP.md). Either way
// it's swapped for a session cookie here, then the student goes on to `next`.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const nextParam = searchParams.get("next") ?? "/progress";
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/progress";

  const supabase = await createClient();
  if (supabase) {
    const code = searchParams.get("code");
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type") as EmailOtpType | null;

    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && type
        ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
        : { error: new Error("No code in the link") };
    if (!error) return NextResponse.redirect(new URL(next, origin));
  }
  return NextResponse.redirect(new URL("/login?error=confirm", origin));
}
