import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api/auth";
import { loadInterviewSessionDetail } from "@/lib/interview/session-detail";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const { id } = await context.params;
  const detail = await loadInterviewSessionDetail(id, auth.user.id, {
    runEvaluationIfMissing: true,
  });

  if (!detail) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({
    session: {
      id: detail.id,
      status: detail.status,
      mode: detail.mode,
      target_role: detail.target_role,
      session_scores: detail.evaluation_summary?.scores ?? detail.session_scores,
      adaptive: detail.adaptive,
      difficulty: detail.difficulty,
      input_mode: detail.input_mode,
      max_followups_per_topic: detail.max_followups_per_topic,
      main_questions_completed: detail.main_questions_completed,
      current_topic_followups: detail.current_topic_followups,
      created_at: detail.created_at,
      updated_at: detail.updated_at,
    },
    turns: detail.turns,
    total_questions: detail.total_questions,
    evaluations: detail.evaluations ?? [],
    evaluation_summary: detail.evaluation_summary ?? null,
  });
}
