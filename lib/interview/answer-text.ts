import type { InterviewTurnDto } from "@/lib/interview/types";

export function getAnswerText(turn: InterviewTurnDto): string {
  return (turn.answer_text ?? turn.transcript ?? "").trim();
}
