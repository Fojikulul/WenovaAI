"use client";

import { AnimatePresence, motion } from "motion/react";
import { useActionState, useState } from "react";
import PillTabs from "@/components/PillTabs";
import { inputClass, labelClass, primaryButton } from "@/components/ui";
import { signIn, signUp, type AuthState } from "./actions";

type Mode = "signin" | "signup";

const TABS = [
  { id: "signin", label: "Sign in" },
  { id: "signup", label: "Create account" },
];

export default function LoginForm({ next, startMode }: { next: string; startMode: Mode }) {
  const [mode, setMode] = useState<Mode>(startMode);
  const [signInState, signInAction, signingIn] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signingUp] = useActionState<AuthState, FormData>(signUp, {});

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
