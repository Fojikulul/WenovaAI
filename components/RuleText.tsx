"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { parseRuleText } from "@/lib/rule-text";

// One rule point with its emphasis (see lib/rule-text.ts). **Highlighted**
// parts are bold green on a soft green highlight that sweeps in from the
// left once the point is on screen; __underlined__ parts get a thick green
// underline. The words themselves never move, so it's easy to read.
export default function RuleText({ text, delay = 0 }: { text: string; delay?: number }) {
  let marker = 0;
  return (
    <>
      {parseRuleText(text).map((part, index) => {
        if (part.style === "highlight") {
          const order = marker++;
          return (
            <motion.strong
              key={index}
              // A soft rounded highlight in the tag colors (WCAG-checked in
              // both themes). box-decoration-break keeps the rounded ends when
              // a highlight wraps onto the next line.
              className="rounded-md bg-[linear-gradient(var(--tag-bg),var(--tag-bg))] bg-no-repeat px-1.5 py-0.5 font-bold text-tag-text [box-decoration-break:clone]"
              initial={{ backgroundSize: "0% 100%" }}
              whileInView={{ backgroundSize: "100% 100%" }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: "easeOut", delay: delay + 0.35 + order * 0.12 }}
            >
              {part.text}
            </motion.strong>
          );
        }
        if (part.style === "underline") {
          return (
            <span
              key={index}
              className="font-semibold text-heading underline decoration-secondary decoration-2 underline-offset-4"
            >
              {part.text}
            </span>
          );
        }
        return <Fragment key={index}>{part.text}</Fragment>;
      })}
    </>
  );
}
