import { after } from "next/server";
import { getClaudeFeedback } from "@/lib/claude";
import { isLessonId } from "@/lib/lesson-ids";
import { MAX_TEXT_LENGTH_BY_MODE, type FeedbackMode } from "@/lib/limits";
import { MOCK_FEEDBACK } from "@/lib/mock-feedback";
import { recordEssayCheck } from "@/lib/progress";
import { getSignedIn } from "@/lib/supabase/server";
import type { Feedback } from "@/lib/validate-feedback";

const TRY_AGAIN = "We couldn't check your writing right now. Please try again.";

const fail = (message: string, status = 400) => Response.json({ error: message }, { status });
const isMode = (value: unknown): value is FeedbackMode => value === "practice" || value === "essay";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { mode, text, lessonId } = (body ?? {}) as Record<string, unknown>;
  if (!isMode(mode)) return fail(TRY_AGAIN);

  const practiceLessonId =
    mode === "practice" && typeof lessonId === "string" && isLessonId(lessonId) ? lessonId : undefined;
  if (mode === "practice" && !practiceLessonId) return fail(TRY_AGAIN);

  if (typeof text !== "string" || !text.trim()) return fail("Please write something first.");
  const maxLength = MAX_TEXT_LENGTH_BY_MODE[mode];
  if (text.length > maxLength) return fail(`Your writing is too long. Please use ${maxLength} characters or fewer.`);

  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return Response.json(MOCK_FEEDBACK[mode]);
  }

  try {
    const feedback = await getClaudeFeedback(text, mode, practiceLessonId);
    if (!feedback) return fail(TRY_AGAIN, 502);
    if (mode === "essay") after(() => saveEssayCheck(feedback));
    return Response.json(feedback);
  } catch {
    // Don't log the error itself: it can contain the student's text.
    console.error("Feedback request to Claude failed");
    return fail(TRY_AGAIN, 502);
  }
}

async function saveEssayCheck(feedback: Feedback) {
  try {
    const signedIn = await getSignedIn();
    if (signedIn) await recordEssayCheck(signedIn.supabase, signedIn.user.id, feedback);
  } catch {
    console.error("Saving the essay check failed");
  }
}
