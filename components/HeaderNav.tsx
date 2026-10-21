"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// The two places in the app. The Essay Checker lives on the home page
// (and at /check), so "Check my essay" is the current page on both.
const LINKS = [
  { href: "/", label: "Check my essay", isCurrent: (path: string) => path === "/" || path === "/check" },
  { href: "/lessons", label: "Lessons", isCurrent: (path: string) => path.startsWith("/lessons") },
];

// Header navigation. The current page is marked for screen readers
// (aria-current) and on screen with a green bar under the words, so it never
// depends on color alone.
export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
      <ul className="flex items-center gap-1 sm:gap-2">
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
