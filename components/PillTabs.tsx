"use client";

import { useLayoutEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

// label can be more than plain text, e.g. a shorter word on phones.
export type PillTab = { id: string; label: ReactNode; badge?: number };

// Pill-shaped tabs, like the option rows in the reference design. A white
// pill slides to the selected tab. Arrow keys, Home and End move between tabs
// (the usual keyboard pattern for tabs); only the selected tab is in the Tab
// order. Each panel needs id `${idPrefix}-panel-${tab.id}` and
// aria-labelledby `${idPrefix}-tab-${tab.id}`.
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
  const pillRef = useRef<HTMLSpanElement>(null);

  // Move the pill under the selected tab, and again whenever the tabs change
  // size (for example when the font finishes loading). This sets the pill's
  // style directly instead of using state, so it never lags a frame behind.
  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!list || !pill) return;

    const place = () => {
      const tab = list.querySelector<HTMLElement>(`[data-tab="${selected}"]`);
      if (!tab) return;
      pill.style.width = `${tab.offsetWidth}px`;
      pill.style.transform = `translateX(${tab.offsetLeft}px)`;
    };
    place();
    const observer = new ResizeObserver(place);
    observer.observe(list);
    return () => observer.disconnect();
  }, [selected, tabs]);

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
      className="relative flex max-w-full shrink-0 gap-1 self-start overflow-x-auto rounded-xl border border-divider bg-surface p-1"
    >
      {/* The sliding pill. It sits behind the tab labels. */}
      <span
        ref={pillRef}
        aria-hidden="true"
        className="absolute top-1 bottom-1 left-0 rounded-lg border border-divider bg-background shadow-sm transition-[transform,width] duration-200 ease-out"
      />
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
            {tab.label}
            {tab.badge !== undefined && (
              <span className="rounded-full bg-divider px-2 text-base leading-6 text-heading">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
