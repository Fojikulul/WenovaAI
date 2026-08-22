import type { Feedback } from "./validate-feedback";

// Sample feedback returned when ANTHROPIC_API_KEY is not set, so the UI can be
// built and tested without calling Claude. It is always the same, so to see
// the underlines line up, paste the sample text written above it.
//
// Sample text:
// Last year, my family move to a new country, and everything felt
// unfamiliar. On the first day of school, I was nervous because I didn't
// knew anyone. My teacher gave me a advice and helped me feel more
// comfortable. After school, I talked with a classmate who was interested
// on the same hobbies as me. Now, I feel more confident speaking English,
// and I enjoy learning something new every day.
export const MOCK_FEEDBACK: Feedback = {
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
};
