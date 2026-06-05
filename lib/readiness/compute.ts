import {
  MIN_SESSIONS_FOR_TRENDS,
  READINESS_WEIGHTS,
  readinessIndexBand,
} from "@/lib/readiness/constants";
import type {
  ReadinessMetrics,
  SessionTrendPoint,
  ThemeRollup,
} from "@/lib/readiness/types";
import type { EvaluationScores } from "@/lib/evaluation/types";

export function computeReadinessIndex(scores: EvaluationScores): number {
  return Math.round(
    scores.communication * READINESS_WEIGHTS.communication +
      scores.structure * READINESS_WEIGHTS.structure +
      scores.content * READINESS_WEIGHTS.content +
      scores.logical_flow * READINESS_WEIGHTS.logical_flow +
      scores.overall * READINESS_WEIGHTS.overall
  );
}

export function averageScores(
  sessions: EvaluationScores[]
): EvaluationScores | null {
  if (sessions.length === 0) return null;

  const sum = sessions.reduce(
    (acc, s) => ({
      communication: acc.communication + s.communication,
      structure: acc.structure + s.structure,
      content: acc.content + s.content,
      logical_flow: acc.logical_flow + s.logical_flow,
      overall: acc.overall + s.overall,
    }),
    {
      communication: 0,
      structure: 0,
      content: 0,
      logical_flow: 0,
      overall: 0,
    }
  );

  const n = sessions.length;
  return {
    communication: Math.round(sum.communication / n),
    structure: Math.round(sum.structure / n),
    content: Math.round(sum.content / n),
    logical_flow: Math.round(sum.logical_flow / n),
    overall: Math.round(sum.overall / n),
  };
}

/** Higher score = more consistent (lower std dev of session overall scores). */
export function computeConsistencyScore(
  overallScores: number[]
): { score: number; label: string } | null {
  if (overallScores.length < 2) return null;

  const mean =
    overallScores.reduce((a, b) => a + b, 0) / overallScores.length;
  const variance =
    overallScores.reduce((acc, v) => acc + (v - mean) ** 2, 0) /
    overallScores.length;
  const stdDev = Math.sqrt(variance);

  const score = Math.round(Math.max(0, Math.min(100, 100 - stdDev * 3)));
  let label = "Moderate";
  if (score >= 80) label = "High";
  else if (score < 50) label = "Low";

  return { score, label };
}

export function rollupThemes(
  items: string[],
  limit = 3
): ThemeRollup[] {
  const counts = new Map<string, { text: string; count: number }>();

  for (const raw of items) {
    const text = raw.trim();
    if (text.length < 4) continue;
    const key = text.toLowerCase();
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, { text, count: 1 });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

type ScoredSession = {
  id: string;
  created_at: string;
  mode: string;
  target_role: string | null;
  session_scores: EvaluationScores;
};

export function buildReadinessMetrics(params: {
  allSessionsCount: number;
  scoredSessions: ScoredSession[];
  strengths: string[];
  improvements: string[];
}): ReadinessMetrics {
  const { allSessionsCount, scoredSessions, strengths, improvements } = params;

  const chronological = [...scoredSessions].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const trends: SessionTrendPoint[] = chronological.map((s, i) => {
    const date = new Date(s.created_at);
    return {
      session_id: s.id,
      date: s.created_at,
      label: `Session ${i + 1}`,
      communication: s.session_scores.communication,
      overall: s.session_scores.overall,
      readiness_index: computeReadinessIndex(s.session_scores),
      scores: s.session_scores,
    };
  });

  const scoreList = chronological.map((s) => s.session_scores);
  const current = averageScores(scoreList);
  const overallScores = scoreList.map((s) => s.overall);
  const consistency = computeConsistencyScore(overallScores);
  const readiness_index = current ? computeReadinessIndex(current) : null;

  return {
    session_count: allSessionsCount,
    completed_scored_count: scoredSessions.length,
    has_trends: scoredSessions.length >= MIN_SESSIONS_FOR_TRENDS,
    current,
    consistency_score: consistency?.score ?? null,
    consistency_label: consistency?.label ?? null,
    readiness_index,
    readiness_band: readiness_index
      ? readinessIndexBand(readiness_index)
      : null,
    trends,
    top_strengths: rollupThemes(strengths),
    top_weaknesses: rollupThemes(improvements),
    session_comparison: [...trends].reverse(),
  };
}
