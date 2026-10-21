"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";

// Motion (motion.dev) animations for the whole app. reducedMotion="user":
// when the device asks for reduced motion, Motion turns off movement and
// size animations (fades still run), like the CSS rule in globals.css does
// for CSS animations.
export default function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
