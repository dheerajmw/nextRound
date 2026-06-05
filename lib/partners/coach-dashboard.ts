import { computeReadinessIndex } from "@/lib/readiness/compute";
import type { CoachMenteeSummary } from "@/lib/partners/types";
import type { EvaluationScores } from "@/lib/evaluation/types";
import { createClient } from "@/lib/supabase/server";

export async function getCoachMenteeSummaries(
  orgId: string
): Promise<CoachMenteeSummary[]> {
  const supabase = await createClient();

  const { data: cohorts } = await supabase
    .from("cohorts")
    .select("id")
    .eq("org_id", orgId);

  const cohortIds = (cohorts ?? []).map((c) => c.id);
  if (cohortIds.length === 0) return [];

  const { data: members } = await supabase
    .from("cohort_members")
    .select("user_id")
    .in("cohort_id", cohortIds)
    .eq("status", "active")
    .not("user_id", "is", null);

  const userIds = [
    ...new Set((members ?? []).map((m) => m.user_id).filter(Boolean)),
  ] as string[];

  if (userIds.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, target_role")
    .in("user_id", userIds);

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("user_id, session_scores, created_at, status")
    .in("user_id", userIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const latestByUser = new Map<
    string,
    { scores: EvaluationScores; created_at: string }
  >();
  const countByUser = new Map<string, number>();

  for (const s of sessions ?? []) {
    countByUser.set(s.user_id, (countByUser.get(s.user_id) ?? 0) + 1);
    if (
      !latestByUser.has(s.user_id) &&
      s.session_scores &&
      typeof s.session_scores === "object"
    ) {
      latestByUser.set(s.user_id, {
        scores: s.session_scores as EvaluationScores,
        created_at: s.created_at,
      });
    }
  }

  return (profiles ?? []).map((p) => {
    const latest = latestByUser.get(p.user_id);
    const readiness = latest
      ? computeReadinessIndex(latest.scores)
      : null;

    return {
      user_id: p.user_id,
      display_name: p.display_name,
      target_role: p.target_role,
      session_count: countByUser.get(p.user_id) ?? 0,
      readiness_index: readiness,
      last_session_at: latest?.created_at ?? null,
    };
  });
}
