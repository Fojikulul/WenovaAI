"use client";

import { motion } from "motion/react";
import { useSyncExternalStore } from "react";
import { lastSevenDays } from "@/lib/progress-summary";

// True once the page runs in the browser. The server doesn't know the
// student's time zone, so the days are only worked out in the browser
// (the server draws an empty frame of the same size).
const subscribe = () => () => {};
function useInBrowser() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

// Activities (essay checks and quizzes) per day for the last 7 days, as
// bars that grow up. Screen readers get the same numbers as a list.
export default function WeeklyChart({ timestamps }: { timestamps: string[] }) {
  const inBrowser = useInBrowser();
  const days = inBrowser ? lastSevenDays(timestamps.map((created_at) => ({ created_at }))) : [];
  const highest = Math.max(1, ...days.map((day) => day.count));

  return (
    <div className="h-44">
      {inBrowser && (
        <ul className="flex h-full items-end gap-2" aria-label="Activities per day, last 7 days">
          {days.map((day, index) => (
            <li key={day.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
              <span aria-hidden="true" className="text-sm font-bold text-heading tabular-nums">
                {day.count > 0 ? day.count : ""}
              </span>
              <span aria-hidden="true" className="flex w-full max-w-10 flex-1 items-end">
                <motion.span
                  className={`block w-full rounded-t-md ${day.count > 0 ? "bg-linear-to-t from-primary to-logo-green" : "bg-divider"}`}
                  initial={{ height: 0 }}
                  animate={{ height: day.count > 0 ? `${(day.count / highest) * 100}%` : "4px" }}
                  transition={{ type: "spring", stiffness: 200, damping: 24, delay: index * 0.05 }}
                />
              </span>
              <span className="text-sm text-muted">
                {day.label}
                <span className="sr-only">: {day.count} {day.count === 1 ? "activity" : "activities"}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
