import Anthropic from "@anthropic-ai/sdk";
import { FEEDBACK_SYSTEM_PROMPT } from "./feedback-prompt";
import { LESSON_IDS } from "./lesson-ids";
import { validateFeedback, type Feedback } from "./validate-feedback";

const MODEL = "claude-sonnet-5-5";

// The JSON shape Claude must reply with (the feedback contract in CLAUDE.md).
// We still run validateFeedback afterwards, because the server should never
// trust outside data blindly.
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

// Sends the student's text to Claude. Returns feedback, or null if Claude's
// reply can't be used. Throws if the API request itself fails.
// Only call this when ANTHROPIC_API_KEY is set (the client reads it from the environment).
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
    system: FEEDBACK_SYSTEM_PROMPT,
    messages: [
      { role: "user", content: `<student_writing>\n${text}\n</student_writing>` },
    ],
  });

  // "refusal" (declined even after fallback) or "max_tokens" (cut off) can't be used.
  if (response.stop_reason !== "end_turn") return null;

  const textBlock = response.content.find(
    (block): block is Anthropic.Beta.BetaTextBlock => block.type === "text",
  );
  if (!textBlock) return null;

  try {
    return validateFeedback(JSON.parse(textBlock.text));
  } catch {
    return null; // not valid JSON
  }
}
