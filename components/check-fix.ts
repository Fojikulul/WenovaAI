export type FixResult = "correct" | "unchanged" | "wrong";

const tidy = (text: string) =>
  text.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, " ").trim();

const loose = (text: string) => tidy(text).replace(/[.!?,;:]+$/, "").trimEnd().toLowerCase();

export function checkFix(answer: string, original: string, fix: string): FixResult {
  // When the mistake itself is case or end punctuation ("i went" -> "I went"), compare strictly.
  const normalize = loose(fix) === loose(original) ? tidy : loose;
  if (normalize(answer) === normalize(fix)) return "correct";
  if (normalize(answer) === normalize(original)) return "unchanged";
  return "wrong";
}
