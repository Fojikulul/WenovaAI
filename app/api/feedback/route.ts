import { getClaudeFeedback } from "@/lib/claude";
import { MOCK_FEEDBACK } from "@/lib/mock-feedback";

const MAX_TEXT_LENGTH = 5000;
const TRY_AGAIN = "We couldn't check your writing right now. Please try again.";

function errorResponse(message: string, status: number) {
  return Response.json({ error: message }, { status });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(TRY_AGAIN, 400);
  }

  const { text } = (body ?? {}) as Record<string, unknown>;

  if (typeof text !== "string" || text.trim() === "") {
    return errorResponse("Please write something first.", 400);
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return errorResponse(
      `Your writing is too long. Please use ${MAX_TEXT_LENGTH} characters or fewer.`,
      400,
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return Response.json(MOCK_FEEDBACK);
  }

  try {
    const feedback = await getClaudeFeedback(text);
    if (!feedback) return errorResponse(TRY_AGAIN, 502);
    return Response.json(feedback);
  } catch {
    // Don't log the error object: student writing must never end up in logs.
    console.error("Feedback request to Claude failed");
    return errorResponse(TRY_AGAIN, 502);
  }
}
