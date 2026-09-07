"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", isCurrent: (path: string) => path === "/" },
  { href: "/check", label: "Check my essay", isCurrent: (path: string) => path === "/check" },
  { href: "/lessons", label: "Lessons", isCurrent: (path: string) => path.startsWith("/lessons") },
];

export default function HeaderNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main">
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
