export type FixResult = "correct" | "unchanged" | "wrong";

function tidy(text: string) {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function loose(text: string) {
  return tidy(text).replace(/[.!?,;:]+$/, "").trimEnd().toLowerCase();
}

export function checkFix(answer: string, original: string, fix: string): FixResult {
  // If the mistake is a capital letter or end punctuation ("i went" -> "I went"), compare exactly,
  // or every answer would look unchanged.
  const same = loose(fix) === loose(original) ? tidy : loose;
  if (same(answer) === same(fix)) return "correct";
  if (same(answer) === same(original)) return "unchanged";
  return "wrong";
}
