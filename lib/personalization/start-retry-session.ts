import { resolveDifficultyForUser } from "@/lib/interview/difficulty";
import { PRACTICE_QUESTIONS_PER_SESSION } from "@/lib/interview/constants";
import { normalizeSession } from "@/lib/interview/normalize-session";
import type { InterviewSessionDto } from "@/lib/interview/types";
import { getPracticeTaskForUser } from "@/lib/personalization/access";
import type { RetryTaskPayload } from "@/lib/personalization/types";
import { createClient } from "@/lib/supabase/server";

export async function startRetrySessionFromTask(params: {
  userId: string;
  taskId: string;
}): Promise<{ session: InterviewSessionDto; sessionId: string } | null> {
  const task = await getPracticeTaskForUser(params.taskId, params.userId);
  if (!task || task.type !== "retry") return null;

  if (task.retry_session_id) {
    const supabase = await createClient();
    const { data: existing } = await supabase
      .from("interview_sessions")
      .select(
        "id, status, mode, target_role, session_scores, adaptive, difficulty, input_mode, max_followups_per_topic, main_questions_completed, current_topic_followups, question_limit, practice_task_id, created_at, updated_at"
      )
      .eq("id", task.retry_session_id)
      .eq("user_id", params.userId)
      .maybeSingle();

    if (existing && existing.status !== "completed") {
      const normalized = normalizeSession(
        existing as Record<string, unknown>
      )!;
      return { session: normalized, sessionId: existing.id };
    }
  }

  const payload = task.payload as RetryTaskPayload;
  if (!payload.question?.trim()) return null;

  const supabase = await createClient();
  const difficulty = await resolveDifficultyForUser(params.userId);
  const mode = payload.mode;
  const targetRole = payload.target_role?.trim() ?? "Software Engineer";

  const { data: session, error: sessionError } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: params.userId,
      status: "in_progress",
      mode,
      target_role: targetRole,
      adaptive: false,
      difficulty,
      input_mode: "both",
      max_followups_per_topic: 0,
      main_questions_completed: 0,
      current_topic_followups: 0,
      question_limit: PRACTICE_QUESTIONS_PER_SESSION,
      practice_task_id: task.id,
    })
    .select(
      "id, status, mode, target_role, session_scores, adaptive, difficulty, input_mode, max_followups_per_topic, main_questions_completed, current_topic_followups, question_limit, practice_task_id, created_at, updated_at"
    )
    .single();

  if (sessionError || !session) {
    throw new Error(sessionError?.message ?? "Failed to create practice session");
  }

  const { data: turn, error: turnError } = await supabase
    .from("interview_turns")
    .insert({
      session_id: session.id,
      turn_index: 0,
      question: payload.question.trim(),
      rationale: "Retry practice — same question from your previous session.",
      turn_type: "primary",
      primary_question_index: 0,
    })
    .select(
      "id, turn_index, question, rationale, answer_text, transcript, turn_type, primary_question_index, audio_url, created_at, answered_at"
    )
    .single();

  if (turnError || !turn) {
    await supabase.from("interview_sessions").delete().eq("id", session.id);
    throw new Error(turnError?.message ?? "Failed to seed retry question");
  }

  await supabase
    .from("practice_tasks")
    .update({
      status: "in_progress",
      retry_session_id: session.id,
    })
    .eq("id", task.id);

  const normalized = normalizeSession(session as Record<string, unknown>)!;
  return { session: normalized, sessionId: session.id };
}
