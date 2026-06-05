import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { hasLlmKeys } from "@/lib/env";
import { getSessionQuestionLimit } from "@/lib/interview/question-limit";
import { startRetrySessionFromTask } from "@/lib/personalization/start-retry-session";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!hasLlmKeys()) {
    return NextResponse.json(
      { error: "LLM not configured", hint: "Set GEMINI_API_KEY and/or OPENROUTER_API_KEY" },
      { status: 503 }
    );
  }

  const { id } = await context.params;

  try {
    const result = await startRetrySessionFromTask({
      userId: auth.user.id,
      taskId: id,
    });

    if (!result) {
      return NextResponse.json(
        { error: "Task not found or not a retry task" },
        { status: 404 }
      );
    }

    const limit = getSessionQuestionLimit(result.session);

    return NextResponse.json({
      session_id: result.sessionId,
      session: result.session,
      redirect: `/interviews/${result.sessionId}`,
      progress: { current: 1, total: limit },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start practice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
