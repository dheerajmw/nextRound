import { createClient } from "@/lib/supabase/server";
import { evaluateTurn } from "@/lib/evaluation/evaluate-turn";
import { buildSessionSummary } from "@/lib/evaluation/session-summary";
import {
  getEvaluationsForSession,
  getSessionScores,
} from "@/lib/evaluation/access";
import type { SessionEvaluationResult } from "@/lib/evaluation/types";
import { getAnswerText } from "@/lib/interview/session-access";
import type { InterviewTurnDto } from "@/lib/interview/types";
import type { InterviewMode } from "@/lib/supabase/database.types";
import { hasLlmKeys } from "@/lib/env";

export async function runSessionEvaluations(params: {
  sessionId: string;
  targetRole: string;
  mode: InterviewMode;
  turns: InterviewTurnDto[];
  userId?: string;
}): Promise<SessionEvaluationResult> {
  const existing = await getEvaluationsForSession(params.sessionId);
  const existingScores = await getSessionScores(params.sessionId);
  const answeredTurns = params.turns.filter(
    (t) => getAnswerText(t).length > 0
  );

  if (
    existing.length >= answeredTurns.length &&
    existing.length > 0 &&
    existingScores
  ) {
    return {
      evaluations: existing,
      summary: {
        scores: existingScores,
        turn_count: existing.length,
      },
    };
  }

  if (!hasLlmKeys()) {
    throw new Error("LLM not configured for evaluation");
  }

  const supabase = await createClient();
  const evaluations = [...existing];

  for (const turn of answeredTurns) {
    if (evaluations.some((e) => e.turn_id === turn.id)) continue;

    const result = await evaluateTurn({
      role: params.targetRole,
      mode: params.mode,
      question: turn.question,
      answer: getAnswerText(turn),
      userId: params.userId,
    });

    const { data: row, error } = await supabase
      .from("evaluations")
      .insert({
        turn_id: turn.id,
        session_id: params.sessionId,
        scores: result.scores,
        feedback: result.feedback,
        prompt_version: result.prompt_version,
        model: result.model,
        provider: result.provider,
      })
      .select(
        "id, turn_id, session_id, scores, feedback, prompt_version, model, provider, created_at"
      )
      .single();

    if (error || !row) {
      throw new Error(error?.message ?? "Failed to store evaluation");
    }

    evaluations.push({
      id: row.id,
      turn_id: row.turn_id,
      session_id: row.session_id,
      scores: row.scores as SessionEvaluationResult["evaluations"][0]["scores"],
      feedback: row.feedback as SessionEvaluationResult["evaluations"][0]["feedback"],
      prompt_version: row.prompt_version,
      model: row.model,
      provider: row.provider,
      created_at: row.created_at,
    });
  }

  const summary = buildSessionSummary(evaluations);

  await supabase
    .from("interview_sessions")
    .update({ session_scores: summary.scores })
    .eq("id", params.sessionId);

  return { evaluations, summary };
}
