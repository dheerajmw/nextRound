import type {
  EvaluationScores,
  SessionEvaluationSummary,
  TurnEvaluationDto,
} from "@/lib/evaluation/types";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(
    values.reduce((sum, v) => sum + v, 0) / values.length
  );
}

export function buildSessionSummary(
  evaluations: TurnEvaluationDto[]
): SessionEvaluationSummary {
  const scores: EvaluationScores = {
    communication: average(evaluations.map((e) => e.scores.communication)),
    structure: average(evaluations.map((e) => e.scores.structure)),
    content: average(evaluations.map((e) => e.scores.content)),
    logical_flow: average(evaluations.map((e) => e.scores.logical_flow)),
    overall: average(evaluations.map((e) => e.scores.overall)),
  };

  return {
    scores,
    turn_count: evaluations.length,
  };
}
