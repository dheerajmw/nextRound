import type { EvaluationScores } from "@/lib/evaluation/types";

export type SessionTrendPoint = {
  session_id: string;
  date: string;
  label: string;
  communication: number;
  overall: number;
  readiness_index: number;
  scores: EvaluationScores;
};

export type ThemeRollup = {
  text: string;
  count: number;
};

export type ReadinessMetrics = {
  session_count: number;
  completed_scored_count: number;
  has_trends: boolean;
  current: EvaluationScores | null;
  consistency_score: number | null;
  consistency_label: string | null;
  readiness_index: number | null;
  readiness_band: "low" | "medium" | "high" | null;
  trends: SessionTrendPoint[];
  top_strengths: ThemeRollup[];
  top_weaknesses: ThemeRollup[];
  session_comparison: SessionTrendPoint[];
};
