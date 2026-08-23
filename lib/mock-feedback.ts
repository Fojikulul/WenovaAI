import type { FeedbackMode } from "./limits";
import type { Feedback } from "./validate-feedback";

// Returned when ANTHROPIC_API_KEY is not set. Paste the sample text above each one to see the underlines line up.
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
  // Last year, my family move to a new country, and everything felt
  // unfamiliar. On the first day of school, I was nervous because I didn't
  // knew anyone. My teacher gave me a advice and helped me feel more
  // comfortable. After school, I talked with a classmate who was interested
  // on the same hobbies as me. Now, I feel more confident speaking English,
  // and I enjoy learning something new every day.
  essay: {
    mistakes: [
      {
        original: "didn't knew",
        fix: "didn't know",
        rule: "past-simple",
        why: "After 'didn't', use the base verb: 'didn't know', not 'didn't knew'.",
      },
      {
        original: "my family move",
        fix: "my family moved",
        rule: "past-simple",
        why: "'Last year' is finished, so use the past form of the verb: 'moved'.",
      },
      {
        original: "a advice",
        fix: "advice",
        rule: "articles",
        why: "'Advice' is a noun you can't count, so don't put 'a' before it. You can also say 'some advice'.",
      },
      {
        original: "interested on",
        fix: "interested in",
        rule: "other",
        why: "We always say 'interested in' something.",
      },
    ],
    summary:
      "You told a clear story about moving to a new country, and your ending is positive and strong. Next, practice the past simple, like 'moved' and 'didn't know'.",
    grade: { grammar: 3, vocabulary: 4, organization: 4, clarity: 4 },
  },
};
