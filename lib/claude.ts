import Anthropic from "@anthropic-ai/sdk";
import { buildFeedbackPrompt } from "./feedback-prompt";
import { LESSON_IDS } from "./lesson-ids";
import { validateFeedback, type Feedback } from "./validate-feedback";

const MODEL = "claude-sonnet-5-5";

// validateFeedback still checks the reply: never trust outside data blindly.
const FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    mistakes: {
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
    },
    summary: { type: "string" },
  },
  required: ["mistakes", "summary"],
  additionalProperties: false,
};

// Only call this when ANTHROPIC_API_KEY is set.
export async function getClaudeFeedback(text: string): Promise<Feedback | null> {
  const client = new Anthropic();

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: {
      // "low" keeps replies fast. Raise it if the feedback misses mistakes.
      effort: "low",
      format: { type: "json_schema", schema: FEEDBACK_SCHEMA },
    },
    // If Sonnet 5.5 declines a request, Anthropic retries it on Claude Sonnet 5.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: buildFeedbackPrompt(),
    messages: [
      { role: "user", content: `<student_writing>\n${text}\n</student_writing>` },
    ],
  });

  if (response.stop_reason !== "end_turn") return null;

  const textBlock = response.content.find(
    (block): block is Anthropic.Beta.BetaTextBlock => block.type === "text",
  );
  if (!textBlock) return null;

  try {
    return validateFeedback(JSON.parse(textBlock.text));
  } catch {
    return null;
  }
}
