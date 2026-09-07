import Anthropic from "@anthropic-ai/sdk";
import { buildFeedbackPrompt } from "./feedback-prompt";
import { LESSON_IDS } from "./lesson-ids";
import type { FeedbackMode } from "./limits";
import {
  GRADE_AREAS,
  keepFindableMistakes,
  validateFeedback,
  type Feedback,
} from "./validate-feedback";

const MODEL = "claude-sonnet-5-5";

// validateFeedback still checks the reply: never trust outside data blindly.
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

// The schema can't use minimum/maximum, so each score is an enum.
const GRADE_SCHEMA = {
  anyOf: [
    {
      type: "object",
      properties: Object.fromEntries(
        GRADE_AREAS.map((area) => [area, { type: "integer", enum: [1, 2, 3, 4, 5] }]),
      ),
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
    properties: {
      mistakes: MISTAKES_SCHEMA,
      summary: { type: "string" },
      ...(essay && { grade: GRADE_SCHEMA }),
    },
    required: essay ? ["mistakes", "summary", "grade"] : ["mistakes", "summary"],
    additionalProperties: false,
  };
}

// Only call this when ANTHROPIC_API_KEY is set.
export async function getClaudeFeedback(
  text: string,
  mode: FeedbackMode,
  lessonId?: string,
): Promise<Feedback | null> {
  const client = new Anthropic();

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: {
      // "low" keeps replies fast. Raise it if the feedback misses mistakes.
      effort: "low",
      format: { type: "json_schema", schema: feedbackSchema(mode) },
    },
    // If Sonnet 5.5 declines a request, Anthropic retries it on Claude Sonnet 5.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: buildFeedbackPrompt(mode, lessonId),
    messages: [
      { role: "user", content: `<student_writing>\n${text}\n</student_writing>` },
    ],
  });

  if (response.stop_reason !== "end_turn") return null;

  const textBlock = response.content.find(
    (block): block is Anthropic.Beta.BetaTextBlock => block.type === "text",
  );
  if (!textBlock) return null;

  let feedback: Feedback | null;
  try {
    feedback = validateFeedback(JSON.parse(textBlock.text), mode);
  } catch {
    return null;
  }
  if (!feedback) return null;

  return { ...feedback, mistakes: keepFindableMistakes(feedback.mistakes, text) };
}
