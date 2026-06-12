import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api/auth";
import { hasLlmKeys } from "@/lib/env";
import { formatLlmApiError } from "@/lib/llm/format-api-error";
import { getLlmErrorStatus } from "@/lib/llm/client";
import { processAnswerSubmission } from "@/lib/interview/process-answer";
import { getSessionForUser } from "@/lib/interview/session-access";

const submitSchema = z.object({
  turn_id: z.string().uuid(),
  answer: z.string().max(8000).optional(),
  transcript: z.string().max(8000).optional(),
  audio_url: z.string().url().optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!hasLlmKeys()) {
    return NextResponse.json(
      { error: "LLM not configured" },
      { status: 503 }
    );
  }

  const { id: sessionId } = await context.params;
  const session = await getSessionForUser(sessionId, auth.user.id);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "in_progress") {
    return NextResponse.json(
      { error: "Session is not in progress" },
      { status: 409 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { turn_id: turnId, answer, transcript, audio_url: audioUrl } =
    parsed.data;

  const answerText = (answer ?? transcript ?? "").trim();
  if (answerText.length < 10) {
    return NextResponse.json(
      { error: "Answer must be at least 10 characters" },
      { status: 400 }
    );
  }

  if (session.input_mode === "voice" && !transcript?.trim() && !answer?.trim()) {
    return NextResponse.json(
      { error: "Voice mode requires a transcript from speech recognition" },
      { status: 400 }
    );
  }

  try {
    const result = await processAnswerSubmission({
      session,
      sessionId,
      turnId,
      answerText,
      transcript: transcript ?? answerText,
      audioUrl: audioUrl ?? null,
      userId: auth.user.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === "OrgLlmCapExceededError") {
      return NextResponse.json({ error: error.message }, { status: 429 });
    }
    const message = formatLlmApiError(error);
    return NextResponse.json(
      { error: message },
      { status: getLlmErrorStatus(error) }
    );
  }
}
