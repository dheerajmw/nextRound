import {
  getEvaluationsForSession,
  getSessionScores,
} from "@/lib/evaluation/access";
import { runSessionEvaluations } from "@/lib/evaluation/run-session-evaluations";
import { buildSessionSummary } from "@/lib/evaluation/session-summary";
import type { InterviewSessionDetail } from "@/lib/interview/types";
import { getAnswerText } from "@/lib/interview/answer-text";
import {
  getSessionForUser,
  getTurnsForSession,
} from "@/lib/interview/session-access";
import { getSessionQuestionLimit } from "@/lib/interview/question-limit";

export async function loadInterviewSessionDetail(
  sessionId: string,
  userId: string,
  options?: { runEvaluationIfMissing?: boolean }
): Promise<InterviewSessionDetail | null> {
  const session = await getSessionForUser(sessionId, userId);
  if (!session) return null;

  const turns = await getTurnsForSession(sessionId);
  const detail: InterviewSessionDetail = {
    ...session,
    turns,
    total_questions: getSessionQuestionLimit(session),
  };

  if (session.status !== "completed") {
    return detail;
  }

  let evaluations = await getEvaluationsForSession(sessionId);
  let sessionScores = await getSessionScores(sessionId);

  if (
    options?.runEvaluationIfMissing &&
    evaluations.length === 0 &&
    turns.some((t) => getAnswerText(t).length > 0)
  ) {
    try {
      const result = await runSessionEvaluations({
        sessionId,
        targetRole: session.target_role?.trim() ?? "Software Engineer",
        mode: session.mode,
        turns,
      });
      evaluations = result.evaluations;
      sessionScores = result.summary.scores;
    } catch {
      // UI can show retry; don't block transcript
    }
  }

  if (evaluations.length > 0) {
    detail.evaluations = evaluations;
    detail.evaluation_summary = sessionScores
      ? { scores: sessionScores, turn_count: evaluations.length }
      : buildSessionSummary(evaluations);
  }

  return detail;
}
