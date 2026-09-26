"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useActionState, useState } from "react";
import PillTabs from "@/components/PillTabs";
import { inputClass, labelClass, primaryButton, textLink } from "@/components/ui";
import { signIn, signInWithGoogle, signUp, type AuthState } from "./actions";

type Mode = "signin" | "signup";

const TABS = [
  { id: "signin", label: "Sign in" },
  { id: "signup", label: "Create account" },
];

export default function LoginForm({ next, startMode }: { next: string; startMode: Mode }) {
  const [mode, setMode] = useState<Mode>(startMode);
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});
  const [googleState, googleAction, goingToGoogle] = useActionState<AuthState, FormData>(signInWithGoogle, {});

  if (signUpState.checkEmail) {
    return (
      <div role="status" className="py-4 text-center">
        <h2 className="text-xl font-semibold">Check your email</h2>
        <p className="mt-2">
          We sent a link to <strong>{signUpState.checkEmail}</strong>. Open it on this device to
          finish creating your account.
        </p>
        <p className="mt-2 text-muted">No email? Check your spam folder, or wait a few minutes.</p>
      </div>
    );
  }

  const state = mode === "signin" ? signInState : signUpState;
  const pending = mode === "signin" ? signingIn : signingUp;

  return (
    <div>
      <form action={googleAction}>
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          disabled={goingToGoogle}
          aria-describedby="google-terms"
          className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-lg border-2 border-border bg-background px-5 py-2.5 font-bold text-text transition-colors hover:border-primary hover:bg-surface disabled:cursor-wait disabled:opacity-70"
        >
          <GoogleLogo />
          {goingToGoogle ? "Opening Google…" : "Continue with Google"}
        </button>
        <p id="google-terms" className="mt-2 text-center text-sm text-muted">
          By continuing, you confirm you are 13 or older and agree to the{" "}
          <Link href="/terms" target="_blank" className="underline underline-offset-[3px] hover:text-heading">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" target="_blank" className="underline underline-offset-[3px] hover:text-heading">
            Privacy Policy
          </Link>
          .
        </p>
        {googleState.error && (
          <p role="alert" className="mt-3 rounded-lg bg-mistake-bg px-4 py-3 font-bold text-mistake-text">
            {googleState.error}
          </p>
        )}
      </form>

      <div className="my-6 flex items-center gap-3 text-muted" aria-hidden="true">
        <span className="h-px flex-1 bg-divider" />
        or use email
        <span className="h-px flex-1 bg-divider" />
      </div>

      <PillTabs
        tabs={TABS}
        selected={mode}
        onSelect={(id) => setMode(id as Mode)}
        idPrefix="auth"
        label="Sign in or create an account"
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.form
          key={mode}
          id={`auth-panel-${mode}`}
          role="tabpanel"
          aria-labelledby={`auth-tab-${mode}`}
          action={mode === "signin" ? signInAction : signUpAction}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mt-6 flex flex-col gap-4"
          noValidate
        >
          <input type="hidden" name="next" value={next} />

          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="displayName" className={labelClass}>
                Name to show <span className="font-normal text-muted">(optional)</span>
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                maxLength={40}
                autoComplete="nickname"
                defaultValue={signUpState.displayName}
                className={inputClass}
              />
              <p className="text-muted">A first name or nickname is enough.</p>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              defaultValue={state.email}
              aria-invalid={state.error ? true : undefined}
              aria-describedby={state.error ? "auth-error" : undefined}
              className={inputClass}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className={labelClass}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={mode === "signup" ? 8 : undefined}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              aria-invalid={state.error ? true : undefined}
              aria-describedby={mode === "signup" ? "password-hint" : state.error ? "auth-error" : undefined}
              className={inputClass}
            />
            {mode === "signup" && (
              <p id="password-hint" className="text-muted">
                At least 8 characters.
              </p>
            )}
          </div>

          {mode === "signup" && (
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="agree"
                value="yes"
                required
                className="mt-1 size-5 shrink-0 accent-primary"
              />
              <span>
                I am 13 or older, and I agree to the{" "}
                <Link href="/terms" target="_blank" className={textLink}>
                  Terms of Use
                </Link>{" "}
                and{" "}
                <Link href="/privacy" target="_blank" className={textLink}>
                  Privacy Policy
                </Link>
                .
              </span>
            </label>
          )}

          {state.error && (
            <p id="auth-error" role="alert" className="rounded-lg bg-mistake-bg px-4 py-3 font-bold text-mistake-text">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className={`mt-2 w-full disabled:cursor-wait disabled:opacity-70 ${primaryButton}`}>
            {pending
              ? mode === "signin"
                ? "Signing in…"
                : "Creating your account…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" className="shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
