import { createClient } from "@/lib/supabase/server";
import type { InterviewMode } from "@/lib/supabase/database.types";

const MAX_CANCELLED_SESSIONS = 10;

/** Questions from recent cancelled mocks — excluded when starting a new session. */
export async function getExcludedQuestionsForNewSession(params: {
  userId: string;
  mode: InterviewMode;
  targetRole: string;
  companyProfileId?: string | null;
}): Promise<string[]> {
  const supabase = await createClient();
  const roleKey = params.targetRole.trim().toLowerCase();

  let query = supabase
    .from("interview_sessions")
    .select("id, target_role")
    .eq("user_id", params.userId)
    .eq("status", "cancelled")
    .eq("mode", params.mode)
    .order("updated_at", { ascending: false })
    .limit(MAX_CANCELLED_SESSIONS);

  if (params.companyProfileId) {
    query = query.eq("company_profile_id", params.companyProfileId);
  }

  const { data: sessions } = await query;

  const matchingIds = (sessions ?? [])
    .filter((s) => (s.target_role ?? "").trim().toLowerCase() === roleKey)
    .map((s) => s.id);

  if (!matchingIds.length) return [];

  const { data: turns } = await supabase
    .from("interview_turns")
    .select("question")
    .in("session_id", matchingIds);

  const seen = new Set<string>();
  const excluded: string[] = [];

  for (const turn of turns ?? []) {
    const q = turn.question?.trim();
    if (!q) continue;
    const key = q.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    excluded.push(q);
  }

  return excluded;
}
