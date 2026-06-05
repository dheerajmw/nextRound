"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EvaluationTracker } from "@/components/interview/evaluation-tracker";
import { TurnFeedbackCard } from "@/components/interview/turn-feedback-card";
import { ScoreGrid } from "@/components/interview/score-display";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type {
  SessionEvaluationSummary,
  TurnEvaluationDto,
} from "@/lib/evaluation/types";
import type { InterviewTurnDto } from "@/lib/interview/types";

export function EvaluationPanel({
  sessionId,
  turns,
  evaluations,
  summary,
  evaluationError,
}: {
  sessionId: string;
  turns: InterviewTurnDto[];
  evaluations: TurnEvaluationDto[];
  summary: SessionEvaluationSummary | null;
  evaluationError?: string | null;
}) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState(evaluationError ?? null);

  const evaluationByTurn = new Map(
    evaluations.map((e) => [e.turn_id, e])
  );

  async function retryEvaluation() {
    setRetrying(true);
    setError(null);
    try {
      const res = await fetch(`/api/interviews/${sessionId}/evaluate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Evaluation failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Could not run evaluation. Try again.");
    } finally {
      setRetrying(false);
    }
  }

  if (!summary || evaluations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Evaluation</CardTitle>
          <CardDescription>
            {error ?? "Scores are not available for this session yet."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            disabled={retrying}
            onClick={retryEvaluation}
          >
            {retrying ? "Evaluating answers…" : "Run evaluation"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <EvaluationTracker sessionId={sessionId} turnCount={evaluations.length} />

      <Card>
        <CardHeader>
          <CardTitle>Session scores</CardTitle>
          <CardDescription>
            Average across {summary.turn_count} answers (0–100)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScoreGrid scores={summary.scores} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Per-answer feedback</CardTitle>
          <CardDescription>
            Communication, structure, STAR, and content notes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-6">
            {turns.map((turn) => {
              const evaluation = evaluationByTurn.get(turn.id);
              if (!evaluation) return null;
              return (
                <TurnFeedbackCard
                  key={turn.id}
                  turn={turn}
                  evaluation={evaluation}
                />
              );
            })}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
