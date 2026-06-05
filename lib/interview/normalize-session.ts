import type { InterviewSessionDto } from "@/lib/interview/types";

/** Backfill defaults when reading sessions created before Phase 4 migration. */
export function normalizeSession(
  row: Record<string, unknown> | null
): InterviewSessionDto | null {
  if (!row) return null;

  return {
    id: row.id as string,
    status: row.status as InterviewSessionDto["status"],
    mode: row.mode as InterviewSessionDto["mode"],
    target_role: (row.target_role as string | null) ?? null,
    session_scores: (row.session_scores as InterviewSessionDto["session_scores"]) ?? null,
    adaptive: (row.adaptive as boolean) ?? true,
    difficulty: (row.difficulty as InterviewSessionDto["difficulty"]) ?? "medium",
    input_mode: (row.input_mode as InterviewSessionDto["input_mode"]) ?? "both",
    max_followups_per_topic: (row.max_followups_per_topic as number) ?? 1,
    main_questions_completed: (row.main_questions_completed as number) ?? 0,
    current_topic_followups: (row.current_topic_followups as number) ?? 0,
    question_limit: (row.question_limit as number) ?? 5,
    practice_task_id: (row.practice_task_id as string | null) ?? null,
    company_profile_id: (row.company_profile_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export function normalizeTurn(row: Record<string, unknown>) {
  return {
    ...row,
    turn_type: (row.turn_type as "primary" | "follow_up") ?? "primary",
    transcript: (row.transcript as string | null) ?? null,
    primary_question_index: (row.primary_question_index as number | null) ?? null,
    audio_url: (row.audio_url as string | null) ?? null,
  };
}
