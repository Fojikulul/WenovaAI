// Marks in lesson rules (data/lessons.json): **text** is highlighted, __text__ is underlined.

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

export function plainRuleText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/__([^_]+)__/g, "$1");
}
