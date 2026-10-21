// Emphasis in lesson rules (data/lessons.json). Two small marks, so the
// team can stress the parts that matter most:
//   **text**  highlighted and bold (the key pattern, e.g. **have/has + past participle**)
//   __text__  underlined (a warning, e.g. __not with a finished time__)
// Marks never cross a sentence, so each bullet point stays whole.

export type RulePart = { text: string; style?: "highlight" | "underline" };

const MARKS = /(\*\*[^*]+\*\*|__[^_]+__)/;

export function parseRuleText(text: string): RulePart[] {
  return text
    .split(MARKS)
    .filter((part) => part !== "")
    .map((part) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return { text: part.slice(2, -2), style: "highlight" as const };
      }
      if (part.startsWith("__") && part.endsWith("__") && part.length > 4) {
        return { text: part.slice(2, -2), style: "underline" as const };
      }
      return { text: part };
    });
}

// The rule without marks, for places that show plain text (the lesson list)
// or send it on (the feedback prompt).
export function plainRuleText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1");
}
