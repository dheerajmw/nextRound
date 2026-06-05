import { Badge } from "@/components/ui/badge";
import { ScoreGrid } from "@/components/interview/score-display";
import type { TurnEvaluationDto } from "@/lib/evaluation/types";
import type { InterviewTurnDto } from "@/lib/interview/types";

export function TurnFeedbackCard({
  turn,
  evaluation,
}: {
  turn: InterviewTurnDto;
  evaluation: TurnEvaluationDto;
}) {
  return (
    <li className="rounded-lg border p-4 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          Question {turn.turn_index + 1}
        </p>
        {evaluation.feedback.star_detected ? (
          <Badge variant="secondary">STAR</Badge>
        ) : null}
        <Badge variant="outline">
          {evaluation.feedback.filler_word_count} filler words
        </Badge>
        <span className="text-xs text-muted-foreground ml-auto">
          {evaluation.provider} · {evaluation.prompt_version}
        </span>
      </div>

      <p className="font-medium">{turn.question}</p>
      {turn.answer_text ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {turn.answer_text}
        </p>
      ) : null}

      <ScoreGrid scores={evaluation.scores} compact />

      <div className="grid gap-4 sm:grid-cols-2 text-sm">
        <div>
          <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-1">
            Strengths
          </p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {evaluation.feedback.strengths.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
            Improvements
          </p>
          <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
            {evaluation.feedback.improvements.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
