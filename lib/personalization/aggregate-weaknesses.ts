import type { EvaluationFeedback, EvaluationScores } from "@/lib/evaluation/types";
import { getAnswerText } from "@/lib/interview/answer-text";
import type { InterviewTurnDto } from "@/lib/interview/types";
import type { SessionWeaknessSummary } from "@/lib/personalization/types";
import type { InterviewMode } from "@/lib/supabase/database.types";

type TurnWithEval = InterviewTurnDto & {
  evaluation?: {
    scores: EvaluationScores;
    feedback: EvaluationFeedback;
  };
};

export function aggregateSessionWeaknesses(params: {
  sessionId: string;
  mode: InterviewMode;
  targetRole: string;
  sessionScores: EvaluationScores | null;
  turns: TurnWithEval[];
}): SessionWeaknessSummary {
  const evaluated = params.turns
    .filter((t) => t.evaluation && getAnswerText(t).length > 0)
    .map((t) => ({
      turn: t,
      scores: t.evaluation!.scores,
      feedback: t.evaluation!.feedback,
    }));

  const dimensionTotals: Record<string, number> = {
    communication: 0,
    structure: 0,
    content: 0,
    logical_flow: 0,
  };
  let dimensionCount = 0;

  for (const { scores } of evaluated) {
    dimensionCount += 1;
    for (const key of Object.keys(dimensionTotals)) {
      dimensionTotals[key] +=
        scores[key as keyof EvaluationScores] ?? 0;
    }
  }

  const dimension_averages: Record<string, number> = {};
  if (dimensionCount > 0) {
    for (const [key, total] of Object.entries(dimensionTotals)) {
      dimension_averages[key] = Math.round(total / dimensionCount);
    }
  }

  const sorted = [...evaluated].sort(
    (a, b) => a.scores.overall - b.scores.overall
  );

  const weak_turns = sorted.slice(0, 3).map(({ turn, scores, feedback }) => ({
    turn_id: turn.id,
    session_id: params.sessionId,
    question: turn.question,
    answer: getAnswerText(turn),
    mode: params.mode,
    target_role: params.targetRole,
    overall_score: scores.overall,
    improvements: feedback.improvements ?? [],
  }));

  const improvementCounts = new Map<string, number>();
  for (const { feedback } of evaluated) {
    for (const item of feedback.improvements ?? []) {
      const normalized = item.trim().toLowerCase();
      if (!normalized) continue;
      improvementCounts.set(
        normalized,
        (improvementCounts.get(normalized) ?? 0) + 1
      );
    }
  }

  const top_improvements = [...improvementCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([text]) => {
      const original = evaluated
        .flatMap((e) => e.feedback.improvements ?? [])
        .find((i) => i.trim().toLowerCase() === text);
      return original ?? text;
    });

  return {
    session_id: params.sessionId,
    mode: params.mode,
    target_role: params.targetRole,
    session_overall: params.sessionScores?.overall ?? 0,
    weak_turns,
    top_improvements,
    dimension_averages,
  };
}
