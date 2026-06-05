export type EvaluationScores = {
  communication: number;
  structure: number;
  content: number;
  logical_flow: number;
  overall: number;
};

export type EvaluationFeedback = {
  star_detected: boolean;
  filler_word_count: number;
  strengths: string[];
  improvements: string[];
};

export type TurnEvaluationDto = {
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

export type SessionEvaluationSummary = {
  scores: EvaluationScores;
  turn_count: number;
};

export type SessionEvaluationResult = {
  evaluations: TurnEvaluationDto[];
  summary: SessionEvaluationSummary;
};
