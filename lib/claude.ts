import Anthropic from "@anthropic-ai/sdk";
import { buildFeedbackPrompt } from "./feedback-prompt";
import { LESSON_IDS } from "./lesson-ids";
import type { FeedbackMode } from "./limits";
import { GRADE_AREAS, keepFindableMistakes, validateFeedback, type Feedback } from "./validate-feedback";

const MODEL = "claude-sonnet-5-5";

const MISTAKES_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      original: { type: "string" },
      fix: { type: "string" },
      rule: { type: "string", enum: [...LESSON_IDS, "other"] },
      why: { type: "string" },
    },
    required: ["original", "fix", "rule", "why"],
    additionalProperties: false,
  },
};

// Structured outputs don't support minimum/maximum, hence the enum.
const GRADE_SCHEMA = {
  anyOf: [
    {
      type: "object",
      properties: Object.fromEntries(GRADE_AREAS.map((area) => [area, { type: "integer", enum: [1, 2, 3, 4, 5] }])),
      required: [...GRADE_AREAS],
      additionalProperties: false,
    },
    { type: "null" },
  ],
};

function feedbackSchema(mode: FeedbackMode) {
  const essay = mode === "essay";
  return {
    type: "object",
    properties: { mistakes: MISTAKES_SCHEMA, summary: { type: "string" }, ...(essay && { grade: GRADE_SCHEMA }) },
    required: essay ? ["mistakes", "summary", "grade"] : ["mistakes", "summary"],
    additionalProperties: false,
  };
}

// Returns null for unusable replies; throws if the request itself fails.
export async function getClaudeFeedback(text: string, mode: FeedbackMode, lessonId?: string): Promise<Feedback | null> {
  const response = await new Anthropic().beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low", format: { type: "json_schema", schema: feedbackSchema(mode) } },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: buildFeedbackPrompt(mode, lessonId),
    messages: [{ role: "user", content: `<student_writing>\n${text}\n</student_writing>` }],
  });

  if (response.stop_reason !== "end_turn") return null;
  const block = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text");
  if (!block) return null;

  let feedback: Feedback | null;
  try {
    feedback = validateFeedback(JSON.parse(block.text), mode);
  } catch {
    return null;
  }
  return feedback && { ...feedback, mistakes: keepFindableMistakes(feedback.mistakes, text) };
}
