import { createClient } from "@/lib/supabase/server";
import type {
  EvaluationFeedback,
  EvaluationScores,
  TurnEvaluationDto,
} from "@/lib/evaluation/types";

type EvaluationRow = {
  id: string;
  turn_id: string;
  session_id: string;
  scores: EvaluationScores;
  feedback: EvaluationFeedback;
  prompt_version: string;
  model: string;
  provider: string;
  created_at: string;
};

function mapRow(row: EvaluationRow): TurnEvaluationDto {
  return {
    id: row.id,
    turn_id: row.turn_id,
    session_id: row.session_id,
    scores: row.scores,
    feedback: row.feedback,
    prompt_version: row.prompt_version,
    model: row.model,
    provider: row.provider,
    created_at: row.created_at,
  };
}

export async function getEvaluationsForSession(
  sessionId: string
): Promise<TurnEvaluationDto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("evaluations")
    .select(
      "id, turn_id, session_id, scores, feedback, prompt_version, model, provider, created_at"
    )
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (data ?? []).map((row) => mapRow(row as EvaluationRow));
}

export async function getSessionScores(
  sessionId: string
): Promise<EvaluationScores | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interview_sessions")
    .select("session_scores")
    .eq("id", sessionId)
    .maybeSingle();

  const scores = data?.session_scores as EvaluationScores | null;
  return scores ?? null;
}
