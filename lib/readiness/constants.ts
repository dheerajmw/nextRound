import type { EvaluationScores } from "@/lib/evaluation/types";

/** Minimum completed scored sessions to show trend charts (Phase 3 exit criteria). */
export const MIN_SESSIONS_FOR_TRENDS = 3;

/** Weights for readiness index (sum = 1). */
export const READINESS_WEIGHTS: Record<keyof EvaluationScores, number> = {
  communication: 0.25,
  structure: 0.25,
  content: 0.2,
  logical_flow: 0.15,
  overall: 0.15,
};

export function readinessIndexBand(index: number): "low" | "medium" | "high" {
  if (index >= 75) return "high";
  if (index >= 50) return "medium";
  return "low";
}
