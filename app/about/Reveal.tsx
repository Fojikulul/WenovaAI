"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

// One section of the About page: it fades up gently the first time it
// scrolls into view. With "reduce motion" on, MotionProvider turns off the
// movement and only the fade runs.
export default function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.section
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.section>
  );
}
