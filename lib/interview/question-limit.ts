import {
  PRACTICE_QUESTIONS_PER_SESSION,
  QUESTIONS_PER_SESSION,
} from "@/lib/interview/constants";

export function getSessionQuestionLimit(
  session: { question_limit?: number | null } | null | undefined
): number {
  const limit = session?.question_limit;
  if (typeof limit === "number" && limit >= 1 && limit <= 10) {
    return limit;
  }
  return QUESTIONS_PER_SESSION;
}

export { PRACTICE_QUESTIONS_PER_SESSION };
