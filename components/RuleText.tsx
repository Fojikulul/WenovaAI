import { Fragment } from "react";
import { parseRuleText } from "@/lib/rule-text";

export default function RuleText({ text }: { text: string }) {
  return (
    <>
      {parseRuleText(text).map((part, index) => {
        if (part.style === "highlight") {
          return (
            <strong
              key={index}
              className="rounded-md bg-tag-bg px-1.5 py-0.5 font-bold text-tag-text [box-decoration-break:clone]"
            >
              {part.text}
            </strong>
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
