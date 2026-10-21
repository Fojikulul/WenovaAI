"use client";

import { AnimatePresence, motion } from "motion/react";
import { useSyncExternalStore } from "react";

// The saved choice lives in localStorage (this device only); the script in
// app/layout.tsx reads it before the page is drawn, so there's no flash.
const STORAGE_KEY = "wenova-theme";

type Theme = "light" | "dark";

// The current theme is the data-theme attribute on <html>. Watching it means
// every toggle on the page stays in step.
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => observer.disconnect();
}
const currentTheme = (): Theme =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

// Moon/sun button in the header, like the reference design. The icon spins
// and swaps when the theme changes.
export default function ThemeToggle() {
  // The server can't know the choice, so it draws the light version first.
  const theme = useSyncExternalStore(subscribe, currentTheme, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be off (private windows): the theme still changes for now.
    }
  }

  return (
    <motion.button
      type="button"
      onClick={toggle}
      whileTap={{ scale: 0.9 }}
      aria-label={`Switch to ${next} theme`}
      className="flex size-11 items-center justify-center overflow-hidden rounded-xl border border-divider bg-background text-heading transition-colors hover:bg-surface"
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.svg
          key={theme}
          initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          {/* Icons: path data from Lucide (lucide.dev), ISC license. The moon
              shows in light mode (go dark), the sun in dark mode (go light). */}
          {theme === "light" ? (
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2" />
              <path d="M12 20v2" />
              <path d="m4.93 4.93 1.41 1.41" />
              <path d="m17.66 17.66 1.41 1.41" />
              <path d="M2 12h2" />
              <path d="M20 12h2" />
              <path d="m6.34 17.66-1.41 1.41" />
              <path d="m19.07 4.93-1.41 1.41" />
            </>
          )}
        </motion.svg>
      </AnimatePresence>
    </motion.button>
  );
}
