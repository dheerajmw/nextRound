import { SESSION_SELECT } from "@/lib/interview/session-access";
import { normalizeSession } from "@/lib/interview/normalize-session";
import type { InterviewSessionDto } from "@/lib/interview/types";
import { createClient } from "@/lib/supabase/server";

export async function cancelInterviewSession(params: {
  sessionId: string;
  userId: string;
}): Promise<InterviewSessionDto> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("interview_sessions")
    .select("id, status")
    .eq("id", params.sessionId)
    .eq("user_id", params.userId)
    .maybeSingle();

  if (!existing) {
    throw new Error("Session not found");
  }

  if (existing.status === "cancelled") {
    const { data: session } = await supabase
      .from("interview_sessions")
      .select(SESSION_SELECT)
      .eq("id", params.sessionId)
      .single();
    const normalized = normalizeSession(session as Record<string, unknown>);
    if (!normalized) throw new Error("Session not found");
    return normalized;
  }

  if (existing.status !== "in_progress") {
    throw new Error("Only in-progress sessions can be cancelled");
  }

  const { data: updated, error } = await supabase
    .from("interview_sessions")
    .update({ status: "cancelled" })
    .eq("id", params.sessionId)
    .eq("user_id", params.userId)
    .select(SESSION_SELECT)
    .single();

  if (error || !updated) {
    throw new Error(error?.message ?? "Failed to cancel session");
  }

  const normalized = normalizeSession(updated as Record<string, unknown>);
  if (!normalized) throw new Error("Failed to cancel session");
  return normalized;
}
