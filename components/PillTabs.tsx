"use client";

import { motion } from "motion/react";
import { useRef, type KeyboardEvent, type ReactNode } from "react";

// label can be more than plain text, e.g. a shorter word on phones.
export type PillTab = { id: string; label: ReactNode; badge?: number };

// Pill-shaped tabs, like the option rows in the reference design. A white
// pill springs to the selected tab (Motion's shared layout animation: the
// pill has one layoutId, so Motion animates it from the old tab to the new
// one). The tabs wrap onto a second line when there isn't room, instead of
// being cut off. Arrow keys, Home and End move between tabs (the usual
// keyboard pattern for tabs); only the selected tab is in the Tab order.
// Each panel needs id `${idPrefix}-panel-${tab.id}` and aria-labelledby
// `${idPrefix}-tab-${tab.id}`.
export default function PillTabs({
  tabs,
  selected,
  onSelect,
  idPrefix,
  label,
}: {
  tabs: PillTab[];
  selected: string;
  onSelect: (id: string) => void;
  idPrefix: string;
  label: string;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  function moveWithKeys(event: KeyboardEvent) {
    const index = tabs.findIndex((tab) => tab.id === selected);
    let next = -1;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    if (next === -1) return;

    event.preventDefault();
    onSelect(tabs[next].id);
    listRef.current?.querySelector<HTMLElement>(`[data-tab="${tabs[next].id}"]`)?.focus();
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label={label}
      onKeyDown={moveWithKeys}
      className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-xl border border-divider bg-surface p-1"
    >
      {tabs.map((tab) => {
        const isSelected = tab.id === selected;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            data-tab={tab.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            className={`relative inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-bold whitespace-nowrap transition-colors ${
              isSelected ? "text-heading" : "text-muted hover:text-heading"
            }`}
          >
            {/* The white pill. Only the selected tab has it; because every
                tab's pill shares one layoutId, it springs across. */}
            {isSelected && (
              <motion.span
                layoutId={`${idPrefix}-pill`}
                aria-hidden="true"
                className="absolute inset-0 rounded-lg border border-divider bg-background shadow-sm"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative">{tab.label}</span>
            {tab.badge !== undefined && (
              <span className="relative rounded-full bg-divider px-2 text-base leading-6 text-heading">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
