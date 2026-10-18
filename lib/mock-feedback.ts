import type { FeedbackMode } from "./limits";
import type { Feedback } from "./validate-feedback";

// Sample feedback returned when ANTHROPIC_API_KEY is not set, so the UI can be
// built and tested without calling Claude. It is always the same, so to see
// the underlines line up, paste the sample text written above each one.
export const MOCK_FEEDBACK: Record<FeedbackMode, Feedback> = {
  // Lesson "past-simple". Sample text:
  // Last weekend I go to the beach with my family. We swimmed in the sea and
  // eat pizza. My brother finded a big shell. It was a really fun day.
  practice: {
    mistakes: [
      {
        original: "I go to the beach",
        fix: "I went to the beach",
        rule: "past-simple",
        why: "'Last weekend' is finished, so use the past form of the verb. 'Go' becomes 'went'.",
      },
      {
        original: "swimmed",
        fix: "swam",
        rule: "past-simple",
        why: "'Swim' is an irregular verb. Its past form is 'swam'.",
      },
      {
        original: "eat pizza",
        fix: "ate pizza",
        rule: "past-simple",
        why: "This happened last weekend, so use the past form of 'eat': 'ate'.",
      },
      {
        original: "finded",
        fix: "found",
        rule: "past-simple",
        why: "'Find' is an irregular verb. Its past form is 'found'.",
      },
    ],
    summary:
      "You told a clear, fun story about your weekend, so now practice the past forms of irregular verbs like go, swim, and find.",
  },

  // Sample text:
  // My dream is to become a engineer. I want to build the bridges that help
  // people in my country. In my city there is an university with good program
  // for engineering. The math is hard for me, but I study every day.
  essay: {
    mistakes: [
      {
        original: "a engineer",
        fix: "an engineer",
        rule: "articles",
        why: "Use 'an' before a word that starts with a vowel sound, like 'engineer'.",
      },
      {
        original: "an university",
        fix: "a university",
        rule: "articles",
        why: "'University' starts with a 'you' sound, so use 'a', not 'an'.",
      },
      {
        original: "with good program",
        fix: "with a good program",
        rule: "articles",
        why: "'Program' is one thing you can count, so it needs 'a' before it.",
      },
    ],
    summary:
      "Your goal of becoming an engineer comes through clearly, so now practice choosing between 'a' and 'an'.",
    grade: { grammar: 3, vocabulary: 3, organization: 3, clarity: 4 },
  },
};
