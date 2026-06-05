import { createClient } from "@/lib/supabase/server";
import { buildReadinessMetrics } from "@/lib/readiness/compute";
import type { ReadinessMetrics } from "@/lib/readiness/types";
import type { EvaluationScores } from "@/lib/evaluation/types";
import type { EvaluationFeedback } from "@/lib/evaluation/types";

export async function getReadinessMetrics(
  userId: string
): Promise<ReadinessMetrics> {
  const supabase = await createClient();

  const { count: sessionCount } = await supabase
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  const { data: completedSessions } = await supabase
    .from("interview_sessions")
    .select("id, created_at, mode, target_role, session_scores")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("session_scores", "is", null)
    .order("created_at", { ascending: true });

  const scoredSessions = (completedSessions ?? [])
    .filter(
      (s) =>
        s.session_scores &&
        typeof s.session_scores === "object" &&
        "overall" in (s.session_scores as object)
    )
    .map((s) => ({
      id: s.id,
      created_at: s.created_at,
      mode: s.mode,
      target_role: s.target_role,
      session_scores: s.session_scores as EvaluationScores,
    }));

  const sessionIds = scoredSessions.map((s) => s.id);
  const strengths: string[] = [];
  const improvements: string[] = [];

  if (sessionIds.length > 0) {
    const { data: evaluations } = await supabase
      .from("evaluations")
      .select("feedback")
      .in("session_id", sessionIds);

    for (const row of evaluations ?? []) {
      const feedback = row.feedback as EvaluationFeedback;
      strengths.push(...(feedback.strengths ?? []));
      improvements.push(...(feedback.improvements ?? []));
    }
  }

  const metrics = buildReadinessMetrics({
    allSessionsCount: sessionCount ?? 0,
    scoredSessions,
    strengths,
    improvements,
  });

  await upsertDailySnapshot(userId, metrics);

  return metrics;
}

async function upsertDailySnapshot(
  userId: string,
  metrics: ReadinessMetrics
): Promise<void> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  await supabase.from("user_readiness_snapshots").upsert(
    {
      user_id: userId,
      snapshot_date: today,
      metrics: {
        readiness_index: metrics.readiness_index,
        consistency_score: metrics.consistency_score,
        current: metrics.current,
        completed_scored_count: metrics.completed_scored_count,
      },
    },
    { onConflict: "user_id,snapshot_date" }
  );
}
