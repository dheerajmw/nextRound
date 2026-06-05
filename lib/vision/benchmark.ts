import { computeReadinessIndex } from "@/lib/readiness/compute";
import type { BenchmarkResult } from "@/lib/vision/types";
import type { EvaluationScores } from "@/lib/evaluation/types";
import { createClient } from "@/lib/supabase/server";

function percentileRank(value: number, population: number[]): number | null {
  if (population.length < 3) return null;
  const below = population.filter((v) => v < value).length;
  return Math.round((below / population.length) * 100);
}

export async function computeUserBenchmark(
  userId: string
): Promise<BenchmarkResult> {
  const supabase = await createClient();

  const { data: userSessions } = await supabase
    .from("interview_sessions")
    .select("session_scores")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("session_scores", "is", null);

  const userScores = (userSessions ?? [])
    .map((s) => s.session_scores as EvaluationScores)
    .filter((s) => s?.overall != null);

  const userIndex =
    userScores.length > 0
      ? computeReadinessIndex(userScores[userScores.length - 1])
      : null;

  const { data: cohortRows } = await supabase
    .from("cohort_members")
    .select("cohort_id")
    .eq("user_id", userId)
    .eq("status", "active");

  let comparison: BenchmarkResult["comparison"] = "global";
  let populationUserIds: string[] = [];

  if (cohortRows && cohortRows.length > 0) {
    const cohortId = cohortRows[0].cohort_id;
    const { data: members } = await supabase
      .from("cohort_members")
      .select("user_id")
      .eq("cohort_id", cohortId)
      .eq("status", "active")
      .not("user_id", "is", null);

    populationUserIds = (members ?? [])
      .map((m) => m.user_id)
      .filter((id): id is string => Boolean(id));
    comparison = "cohort";
  }

  if (populationUserIds.length < 3) {
    const { data: allSessions } = await supabase
      .from("interview_sessions")
      .select("user_id, session_scores")
      .eq("status", "completed")
      .not("session_scores", "is", null)
      .neq("user_id", userId)
      .limit(500);

    const latestByUser = new Map<string, number>();
    for (const row of allSessions ?? []) {
      const scores = row.session_scores as EvaluationScores;
      if (!scores?.overall) continue;
      latestByUser.set(row.user_id, scores.overall);
    }
    populationUserIds = [...latestByUser.keys()];
    comparison = "global";
  }

  const { data: popSessions } = await supabase
    .from("interview_sessions")
    .select("user_id, session_scores")
    .in("user_id", populationUserIds)
    .eq("status", "completed")
    .not("session_scores", "is", null);

  const latestByUser = new Map<string, number>();
  for (const row of popSessions ?? []) {
    const scores = row.session_scores as EvaluationScores;
    if (!scores?.overall) continue;
    latestByUser.set(row.user_id, scores.overall);
  }

  const population = [...latestByUser.values()];
  const percentile =
    userIndex != null ? percentileRank(userIndex, population) : null;

  return {
    readiness_index: userIndex,
    percentile,
    cohort_label:
      comparison === "cohort" ? "Your cohort" : "All nextRound users",
    sample_size: population.length,
    comparison,
  };
}
