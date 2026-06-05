import { averageScores, computeReadinessIndex } from "@/lib/readiness/compute";
import type { CohortAnalytics, CohortMemberSummary } from "@/lib/partners/types";
import type { EvaluationScores } from "@/lib/evaluation/types";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export async function computeCohortAnalytics(
  cohortId: string
): Promise<CohortAnalytics | null> {
  const supabase = await createClient();

  const { data: cohort } = await supabase
    .from("cohorts")
    .select("id, name, org_id")
    .eq("id", cohortId)
    .single();

  if (!cohort) return null;

  const { data: members } = await supabase
    .from("cohort_members")
    .select("id, email, user_id, status")
    .eq("cohort_id", cohortId);

  const active = (members ?? []).filter(
    (m) => m.status === "active" && m.user_id
  );
  const pending = (members ?? []).filter((m) => m.status === "pending").length;

  const userIds = active.map((m) => m.user_id!);
  const summaries: CohortMemberSummary[] = [];

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileByUser = new Map(
      (profiles ?? []).map((p) => [p.user_id, p.display_name])
    );

    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("user_id, session_scores, status")
      .in("user_id", userIds)
      .eq("status", "completed")
      .not("session_scores", "is", null);

    const scoresByUser = new Map<string, EvaluationScores[]>();
    const countByUser = new Map<string, number>();

    for (const s of sessions ?? []) {
      if (!s.session_scores || typeof s.session_scores !== "object") continue;
      const scores = s.session_scores as EvaluationScores;
      const list = scoresByUser.get(s.user_id) ?? [];
      list.push(scores);
      scoresByUser.set(s.user_id, list);
      countByUser.set(s.user_id, (countByUser.get(s.user_id) ?? 0) + 1);
    }

    for (const m of active) {
      const uid = m.user_id!;
      const userScores = scoresByUser.get(uid) ?? [];
      const avg = averageScores(userScores);
      const readiness =
        avg != null ? computeReadinessIndex(avg) : null;
      const display = profileByUser.get(uid);
      const label =
        display?.trim() ||
        m.email.replace(/(.{2}).*(@.*)/, "$1***$2");

      summaries.push({
        member_id: m.id,
        label,
        session_count: countByUser.get(uid) ?? 0,
        completed_scored_count: userScores.length,
        readiness_index: readiness,
        avg_overall: avg?.overall ?? null,
      });
    }
  }

  const readinessValues = summaries
    .map((s) => s.readiness_index)
    .filter((v): v is number => v != null);

  const avgReadiness =
    readinessValues.length > 0
      ? Math.round(
          readinessValues.reduce((a, b) => a + b, 0) / readinessValues.length
        )
      : null;

  const { data: sessions } = userIds.length
    ? await supabase
        .from("interview_sessions")
        .select("session_scores")
        .in("user_id", userIds)
        .eq("status", "completed")
        .not("session_scores", "is", null)
    : { data: [] };

  const cohortScores = (sessions ?? [])
    .map((s) => s.session_scores as EvaluationScores)
    .filter((s) => s && typeof s.overall === "number");

  const analytics: CohortAnalytics = {
    cohort_id: cohort.id,
    cohort_name: cohort.name,
    member_count: members?.length ?? 0,
    active_member_count: active.length,
    pending_invites: pending,
    avg_readiness_index: avgReadiness,
    avg_scores: averageScores(cohortScores),
    members: summaries.sort(
      (a, b) => (b.readiness_index ?? 0) - (a.readiness_index ?? 0)
    ),
    privacy_note:
      "Aggregates only — interview answers and transcripts are not exposed to org staff.",
  };

  await supabase.from("org_analytics_snapshots").upsert(
    {
      org_id: cohort.org_id,
      cohort_id: cohort.id,
      snapshot_date: new Date().toISOString().slice(0, 10),
      metrics: {
        avg_readiness_index: analytics.avg_readiness_index,
        active_member_count: analytics.active_member_count,
        member_count: analytics.member_count,
      } as Json,
    },
    { onConflict: "org_id,cohort_id,snapshot_date" }
  );

  return analytics;
}

export function cohortAnalyticsToCsv(analytics: CohortAnalytics): string {
  const header =
    "member_id,label,session_count,scored_sessions,readiness_index,avg_overall";
  const rows = analytics.members.map((m) =>
    [
      m.member_id,
      `"${m.label.replace(/"/g, '""')}"`,
      m.session_count,
      m.completed_scored_count,
      m.readiness_index ?? "",
      m.avg_overall ?? "",
    ].join(",")
  );
  return [header, ...rows].join("\n");
}
