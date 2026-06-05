import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { hasLlmKeys } from "@/lib/env";
import { runSessionEvaluations } from "@/lib/evaluation/run-session-evaluations";
import {
  getSessionForUser,
  getTurnsForSession,
} from "@/lib/interview/session-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  if (!hasLlmKeys()) {
    return NextResponse.json({ error: "LLM not configured" }, { status: 503 });
  }

  const { id: sessionId } = await context.params;
  const session = await getSessionForUser(sessionId, auth.user.id);

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.status !== "completed") {
    return NextResponse.json(
      { error: "Session must be completed before evaluation" },
      { status: 409 }
    );
  }

  const turns = await getTurnsForSession(sessionId);

  try {
    const result = await runSessionEvaluations({
      sessionId,
      targetRole: session.target_role?.trim() ?? "Software Engineer",
      mode: session.mode,
      turns,
    });

    return NextResponse.json({
      evaluations: result.evaluations,
      evaluation_summary: result.summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
