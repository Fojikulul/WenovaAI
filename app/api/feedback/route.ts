import { getClaudeFeedback } from "@/lib/claude";
import { isLessonId } from "@/lib/lesson-ids";
import { MAX_TEXT_LENGTH_BY_MODE, type FeedbackMode } from "@/lib/limits";
import { MOCK_FEEDBACK } from "@/lib/mock-feedback";

const TRY_AGAIN = "We couldn't check your writing right now. Please try again.";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

function isMode(value: unknown): value is FeedbackMode {
  return value === "practice" || value === "essay";
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(TRY_AGAIN, 400);
  }

  const { mode, text, lessonId } = (body ?? {}) as Record<string, unknown>;

  if (!isMode(mode)) return errorResponse(TRY_AGAIN, 400);

  let practiceLessonId: string | undefined;
  if (mode === "practice") {
    if (typeof lessonId !== "string" || !isLessonId(lessonId)) {
      return errorResponse(TRY_AGAIN, 400);
    }
    practiceLessonId = lessonId;
  }

  if (typeof text !== "string" || text.trim() === "") {
    return errorResponse("Please write something first.", 400);
  }
  const maxLength = MAX_TEXT_LENGTH_BY_MODE[mode];
  if (text.length > maxLength) {
    return errorResponse(
      `Your writing is too long. Please use ${maxLength} characters or fewer.`,
      400,
    );
  }

  // "prompt" isn't used yet: text from the browser must never go into Claude's instructions.

  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return Response.json(MOCK_FEEDBACK[mode]);
  }

  try {
    const feedback = await getClaudeFeedback(text, mode, practiceLessonId);
    if (!feedback) return errorResponse(TRY_AGAIN, 502);
    return Response.json(feedback);
  } catch {
    // Don't log the error object: student writing must never end up in logs.
    console.error("Feedback request to Claude failed");
    return errorResponse(TRY_AGAIN, 502);
  }
}
