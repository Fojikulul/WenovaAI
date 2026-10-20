// Compares the student's own fix with the AI's fix. This runs in code, not
// with AI (CLAUDE.md "How the interactive fix works").

export type FixResult = "correct" | "unchanged" | "wrong";

// Straight apostrophes and quotes (phones often type curly ones), single
// spaces, and no spaces at the ends.
function tidy(text: string) {
  return text
    .replace(/[‘’ʼ]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Also ignores capital letters and punctuation at the end, as CLAUDE.md says.
function loose(text: string) {
  return tidy(text).replace(/[.!?,;:]+$/, "").trimEnd().toLowerCase();
}

// "correct": the answer matches the fix.
// "unchanged": the student sent their original words back.
// "wrong": anything else.
export function checkFix(answer: string, original: string, fix: string): FixResult {
  // If the mistake IS a capital letter or end punctuation ("i went" -> "I
  // went"), ignoring those would make every answer look unchanged, so then
  // the words are compared exactly.
  const same = loose(fix) === loose(original) ? tidy : loose;
  if (same(answer) === same(fix)) return "correct";
  if (same(answer) === same(original)) return "unchanged";
  return "wrong";
}
