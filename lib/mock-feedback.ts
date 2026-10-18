import type { Feedback } from "./validate-feedback";

// Sample feedback returned when ANTHROPIC_API_KEY is not set, so the UI can be
// built and tested without calling Claude. It is always the same, so the
// "original" phrases won't match what the student actually typed.
export const MOCK_FEEDBACK: Feedback = {
  mistakes: [
    {
      original: "Yesterday I go to the library with my friend.",
      fix: "Yesterday I went to the library with my friend.",
      rule: "past-simple",
      why: "Yesterday means the action is finished, so use the past simple.",
    },
    {
      original: "I want to be a engineer.",
      fix: "I want to be an engineer.",
      rule: "articles",
      why: 'Use "an" before a word that starts with a vowel sound.',
    },
    {
      original: "My sister speak three languages.",
      fix: "My sister speaks three languages.",
      rule: "subject-verb-agreement",
      why: 'With one person, like "my sister", add -s to the verb.',
    },
  ],
  summary:
    'Great job telling a clear story about your family! Check your past tense and small words like "a" and "an".',
};
