"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

// Remembered on this device once the student presses OK.
const STORAGE_KEY = "wenova-cookie-notice";
const CHANGED = "wenova-cookie-notice-change";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(CHANGED, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(CHANGED, onChange);
  };
}

function seenNotice() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "ok";
  } catch {
    // Storage blocked: don't keep showing a notice that can't be dismissed
    // for good.
    return true;
  }
}

// A small first-visit notice: Wenova only uses cookies that keep you signed
// in (no tracking), so there's nothing to accept or reject; the notice just
// says so and links to /cookies. It sits in the bottom-left corner (phones:
// along the bottom), away from the main buttons, and slides up. The server
// draws nothing (it can't see localStorage), so the page never jumps.
export default function CookieNotice() {
  const seen = useSyncExternalStore(subscribe, seenNotice, () => true);

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "ok");
    } catch {
      // Storage blocked: it hides for this page view only.
    }
    window.dispatchEvent(new Event(CHANGED));
  }

  return (
    <AnimatePresence>
      {!seen && (
        <motion.section
          aria-label="Cookies"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 300, damping: 26, delay: 0.6 }}
          className="fixed inset-x-3 bottom-3 z-30 rounded-2xl border border-divider bg-background p-4 shadow-xl sm:inset-x-auto sm:left-4 sm:bottom-4 sm:max-w-sm"
        >
          <div className="flex gap-3">
            {/* Cookie icon: path data from Lucide (lucide.dev), ISC license. Decorative. */}
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tag-bg text-tag-text"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
                <path d="M8.5 8.5v.01" />
                <path d="M16 15.5v.01" />
                <path d="M12 12v.01" />
                <path d="M11 17v.01" />
                <path d="M7 14v.01" />
              </svg>
            </span>
            <p>
              Wenova only uses cookies to keep you signed in. No ads, no tracking.{" "}
              <Link href="/cookies" className="font-bold text-secondary underline underline-offset-[3px] hover:text-secondary-hover">
                Learn more
              </Link>
            </p>
          </div>
          <motion.button
            type="button"
            onClick={dismiss}
            whileTap={{ scale: 0.97 }}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-5 font-bold text-on-primary transition-colors hover:bg-primary-hover"
          >
            OK, got it
          </motion.button>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
