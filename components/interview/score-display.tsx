import { cn } from "@/lib/utils";
import type { EvaluationScores } from "@/lib/evaluation/types";

const DIMENSION_LABELS: { key: keyof EvaluationScores; label: string }[] = [
  { key: "overall", label: "Overall" },
  { key: "communication", label: "Communication" },
  { key: "structure", label: "Structure" },
  { key: "content", label: "Content" },
  { key: "logical_flow", label: "Logical flow" },
];

function scoreColor(score: number): string {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 60) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

export function ScoreGrid({
  scores,
  compact = false,
}: {
  scores: EvaluationScores;
  compact?: boolean;
}) {
  const items = compact
    ? DIMENSION_LABELS
    : DIMENSION_LABELS.filter((d) => d.key !== "overall");

  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "grid-cols-2 sm:grid-cols-3" : "sm:grid-cols-2"
      )}
    >
      {!compact ? (
        <div className="rounded-lg border bg-primary/5 p-4 sm:col-span-2">
          <p className="text-xs text-muted-foreground">Overall</p>
          <p
            className={cn(
              "text-3xl font-semibold tabular-nums",
              scoreColor(scores.overall)
            )}
          >
            {scores.overall}
          </p>
        </div>
      ) : null}
      {items.map(({ key, label }) => (
        <div key={key} className="rounded-lg border px-3 py-2">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={cn(
              "text-lg font-semibold tabular-nums",
              scoreColor(scores[key])
            )}
          >
            {scores[key]}
          </p>
        </div>
      ))}
    </div>
  );
}
