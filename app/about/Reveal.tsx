"use client";

import { animate, inView, useReducedMotion } from "motion/react";
import { useEffect, useRef, type ReactNode } from "react";

export default function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const section = ref.current;
    if (!section || section.getBoundingClientRect().top < window.innerHeight) return;
    const from = reduce ? "none" : "translateY(16px)";
    section.style.opacity = "0";
    section.style.transform = from;
    const stop = inView(
      section,
      () => {
        animate(section, { opacity: [0, 1], transform: [from, "none"] }, { duration: 0.5, ease: "easeOut" });
      },
      { margin: "0px 0px -60px 0px" },
    );
    return () => {
      stop();
      section.style.opacity = "";
      section.style.transform = "";
    };
  }, [reduce]);

  return (
    <section ref={ref} className={className}>
      {children}
    </section>
  );
}
