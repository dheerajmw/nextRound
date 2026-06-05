import { isMissingTableError } from "@/lib/db/schema-errors";
import { createClient } from "@/lib/supabase/server";
import { getAnswerText } from "@/lib/interview/answer-text";
import { normalizeSession, normalizeTurn } from "@/lib/interview/normalize-session";
import type { InterviewSessionDto, InterviewTurnDto } from "@/lib/interview/types";
import { QUESTIONS_PER_SESSION } from "@/lib/interview/constants";

export { getAnswerText };

export const SESSION_SELECT =
  "id, status, mode, target_role, session_scores, adaptive, difficulty, input_mode, max_followups_per_topic, main_questions_completed, current_topic_followups, question_limit, practice_task_id, company_profile_id, created_at, updated_at";

const TURN_SELECT =
  "id, turn_index, question, rationale, answer_text, transcript, turn_type, primary_question_index, audio_url, created_at, answered_at";

export async function getSessionForUser(
  sessionId: string,
  userId: string
): Promise<InterviewSessionDto | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error && isMissingTableError(error)) return null;

  return normalizeSession(data as Record<string, unknown> | null);
}

export async function getTurnsForSession(
  sessionId: string
): Promise<InterviewTurnDto[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("interview_turns")
    .select(TURN_SELECT)
    .eq("session_id", sessionId)
    .order("turn_index", { ascending: true });

  return (data ?? []).map((row) =>
    normalizeTurn(row as Record<string, unknown>)
  ) as InterviewTurnDto[];
}

export function getOpenTurn(turns: InterviewTurnDto[]): InterviewTurnDto | null {
  return turns.find((t) => getAnswerText(t).length === 0) ?? null;
}

export function buildPreviousTurns(
  turns: InterviewTurnDto[]
): { question: string; answer: string }[] {
  return turns
    .filter((t) => getAnswerText(t).length > 0)
    .map((t) => ({
      question: t.question,
      answer: getAnswerText(t),
    }));
}

export function countPrimaryQuestions(turns: InterviewTurnDto[]): number {
  return turns.filter((t) => t.turn_type === "primary").length;
}

export const TOTAL_QUESTIONS = QUESTIONS_PER_SESSION;
