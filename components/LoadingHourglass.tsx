"use client";

import { motion } from "motion/react";

// Frame paths: Lucide "hourglass" (ISC license).

const LOOP = { duration: 1.2, repeat: Infinity, ease: "linear" as const };
const SAND = { fill: "currentColor", stroke: "none", opacity: 0.55, style: { originY: 1 } };

// The flip leaves the full bulb on top, so restarting the loop is seamless.
export default function LoadingHourglass({ size = 24 }: { size?: number }) {
  return (
    <svg
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
        transition={{ ...LOOP, ease: "easeInOut", times: [0, 0.75, 1] }}
      >
        <motion.path d="M8.5 6.5h7L12 11z" {...SAND} animate={{ scaleY: [1, 0, 0] }} transition={{ ...LOOP, times: [0, 0.72, 1] }} />
        <motion.path
          d="M12 12v6"
          strokeWidth={1.5}
          animate={{ opacity: [0.55, 0.55, 0, 0] }}
          transition={{ ...LOOP, times: [0, 0.68, 0.72, 1] }}
        />
        <motion.path d="M7.5 20.5h9L12 15.5z" {...SAND} animate={{ scaleY: [0, 1, 1] }} transition={{ ...LOOP, times: [0, 0.72, 1] }} />
        <path d="M5 22h14M5 2h14" />
        <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
        <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
      </motion.g>
    </svg>
  );
}
