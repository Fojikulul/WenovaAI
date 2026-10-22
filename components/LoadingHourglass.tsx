"use client";

import { motion } from "motion/react";

// The hourglass shown while the writing is being checked. Sand drains from
// the top bulb into the bottom one, then the hourglass flips over and it
// starts again (1.2s a turn). After the flip the full bulb is on top again, so
// jumping back to the start is invisible and the loop is seamless.
// Decorative: the "Checking your writing…" text next to it says the same.
// With "reduce motion" on, Motion skips the flip and the sand (they are
// transforms; see components/MotionProvider.tsx), so it just stands still.
// Frame path data from Lucide's hourglass (lucide.dev), ISC license.

const TURN = { duration: 1.2, repeat: Infinity, ease: "easeInOut" as const };

export default function LoadingHourglass({ size = 24 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="shrink-0"
    >
      <motion.g
        style={{ originX: 0.5, originY: 0.5 }}
        animate={{ rotate: [0, 0, 180] }}
        transition={{ ...TURN, times: [0, 0.75, 1] }}
      >
        {/* Sand in the top bulb: drains toward the neck. */}
        <motion.path
          d="M8.5 6.5h7L12 11z"
          fill="currentColor"
          stroke="none"
          opacity={0.55}
          style={{ originY: 1 }}
          animate={{ scaleY: [1, 0, 0] }}
          transition={{ ...TURN, ease: "linear", times: [0, 0.72, 1] }}
        />
        {/* The thin stream falling through the neck. */}
        <motion.path
          d="M12 12v6"
          strokeWidth={1.5}
          opacity={0.55}
          animate={{ opacity: [0.55, 0.55, 0, 0] }}
          transition={{ ...TURN, ease: "linear", times: [0, 0.68, 0.72, 1] }}
        />
        {/* Sand piling up in the bottom bulb. */}
        <motion.path
          d="M7.5 20.5h9L12 15.5z"
          fill="currentColor"
          stroke="none"
          opacity={0.55}
          style={{ originY: 1 }}
          animate={{ scaleY: [0, 1, 1] }}
          transition={{ ...TURN, ease: "linear", times: [0, 0.72, 1] }}
        />
        {/* The glass. */}
        <path d="M5 22h14" />
        <path d="M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </motion.g>
    </svg>
  );
}
