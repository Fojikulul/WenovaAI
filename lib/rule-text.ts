export type RulePart = { text: string; style?: "highlight" | "underline" };

const MARK = /(\*\*[^*]+\*\*|__[^_]+__)/;

export function parseRuleText(text: string): RulePart[] {
  return text
    .split(MARK)
    .filter(Boolean)
    .map((part) => {
      const match = /^(\*\*|__)(.+)\1$/.exec(part);
      if (!match) return { text: part };
      return { text: match[2], style: match[1] === "**" ? "highlight" : "underline" };
    });
}

export function plainRuleText(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, "$1$2");
}
