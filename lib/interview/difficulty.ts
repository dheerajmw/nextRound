import {
  DIFFICULTY_LOOKBACK_SESSIONS,
  type InterviewDifficulty,
} from "@/lib/interview/constants";
import { createClient } from "@/lib/supabase/server";
import type { EvaluationScores } from "@/lib/evaluation/types";

export function difficultyFromAverageScore(
  avgOverall: number | null
): InterviewDifficulty {
  if (avgOverall == null) return "medium";
  if (avgOverall >= 78) return "hard";
  if (avgOverall >= 55) return "medium";
  return "easy";
}

export async function resolveDifficultyForUser(
  userId: string
): Promise<InterviewDifficulty> {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("session_scores")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("session_scores", "is", null)
    .order("created_at", { ascending: false })
    .limit(DIFFICULTY_LOOKBACK_SESSIONS);

  const scores = (sessions ?? [])
    .map((s) => s.session_scores as EvaluationScores | null)
    .filter((s): s is EvaluationScores => s != null && "overall" in s);

  if (scores.length === 0) return "medium";

  const avg =
    scores.reduce((sum, s) => sum + s.overall, 0) / scores.length;

  return difficultyFromAverageScore(Math.round(avg));
}
