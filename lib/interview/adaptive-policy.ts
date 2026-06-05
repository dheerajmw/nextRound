import type { InterviewDifficulty, InterviewTurnType } from "@/lib/interview/constants";
import { analyzeAnswer } from "@/lib/interview/analyze-answer";
import type { InterviewMode } from "@/lib/supabase/database.types";

export type FollowUpDecision = {
  shouldFollowUp: boolean;
  reason: string | null;
};

export function decideFollowUp(params: {
  answerText: string;
  mode: InterviewMode;
  turnType: InterviewTurnType;
  adaptive: boolean;
  followupsUsed: number;
  maxFollowups: number;
  difficulty: InterviewDifficulty;
}): FollowUpDecision {
  if (!params.adaptive) {
    return { shouldFollowUp: false, reason: null };
  }

  if (params.turnType === "follow_up") {
    return { shouldFollowUp: false, reason: null };
  }

  if (params.followupsUsed >= params.maxFollowups) {
    return { shouldFollowUp: false, reason: null };
  }

  const analysis = analyzeAnswer(params.answerText, params.mode);

  if (analysis.is_vague) {
    return {
      shouldFollowUp: true,
      reason:
        "Answer was brief or vague — asking a clarifying follow-up before the next topic.",
    };
  }

  if (analysis.lacks_structure) {
    return {
      shouldFollowUp: true,
      reason:
        "Structure gap detected — probing with a STAR-style follow-up.",
    };
  }

  if (params.difficulty === "hard" && analysis.word_count < 80) {
    return {
      shouldFollowUp: true,
      reason:
        "Hard difficulty session — requesting more depth on this topic.",
    };
  }

  return { shouldFollowUp: false, reason: null };
}
