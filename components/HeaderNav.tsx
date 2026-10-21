"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// The places in the app. The Essay Checker lives on the home page (and at
// /check), so "Check my essay" is the current page on both. Settings is
// reached from the account button next to the theme switch.
const LINKS = [
  { href: "/", label: "Check my essay", isCurrent: (path: string) => path === "/" || path === "/check" },
  { href: "/lessons", label: "Lessons", isCurrent: (path: string) => path.startsWith("/lessons") },
  { href: "/progress", label: "My progress", isCurrent: (path: string) => path.startsWith("/progress") },
];

// Header navigation for tablets and up. The current page is marked for
// screen readers (aria-current) and on screen with a green bar under the
// words, so it never depends on color alone.
export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main" className="hidden md:block">
      <ul className="flex items-center gap-1 lg:gap-2">
        {LINKS.map((link) => {
          const current = link.isCurrent(pathname);
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current ? "page" : undefined}
                className={`relative flex min-h-11 items-center rounded-lg px-3 font-bold whitespace-nowrap transition-colors hover:bg-surface ${
                  current ? "text-heading" : "text-muted hover:text-heading"
                }`}
              >
                {link.label}
                {current && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-secondary"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Phones: a "Menu" button that opens the same links in a panel under the
// header. Escape or picking a link closes it.
export function MobileMenu() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
        className="flex size-11 items-center justify-center rounded-lg border border-divider text-heading transition-colors hover:bg-surface"
      >
        <span className="sr-only">{open ? "Close menu" : "Menu"}</span>
        {/* Menu / X icons: path data from Lucide (lucide.dev), ISC license. */}
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          {open ? (
            <>
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </>
          ) : (
            <>
              <path d="M4 6h16" />
              <path d="M4 12h16" />
              <path d="M4 18h16" />
            </>
          )}
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.nav
            id="mobile-menu"
            aria-label="Main"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full border-b border-divider bg-background px-4 py-3 shadow-lg"
          >
            <ul className="flex flex-col gap-1">
              {LINKS.map((link) => {
                const current = link.isCurrent(pathname);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      aria-current={current ? "page" : undefined}
                      className={`flex min-h-12 items-center rounded-lg px-3 text-lg font-bold transition-colors hover:bg-surface ${
                        current ? "bg-surface text-heading" : "text-muted"
                      }`}
                    >
                      {current && <span aria-hidden="true" className="mr-3 h-6 w-1 rounded-full bg-secondary" />}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </div>
  );
}
