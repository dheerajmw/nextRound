import type { SessionWeaknessSummary } from "@/lib/personalization/types";

export function buildGeneratePracticePlanPrompt(
  weakness: SessionWeaknessSummary
): string {
  const weakTurnsJson = JSON.stringify(
    weakness.weak_turns.map((t) => ({
      turn_id: t.turn_id,
      session_id: t.session_id,
      overall_score: t.overall_score,
      question: t.question.slice(0, 200),
      improvements: t.improvements,
    })),
    null,
    2
  );

  return `You are an expert interview coach creating a personalized practice plan after a mock interview.

Session context:
- Mode: ${weakness.mode}
- Target role: ${weakness.target_role}
- Session overall score: ${weakness.session_overall}/100
- Dimension averages: ${JSON.stringify(weakness.dimension_averages)}
- Recurring improvement themes: ${weakness.top_improvements.join("; ") || "none yet"}

Weakest answers (use these turn_id and session_id for retry tasks):
${weakTurnsJson}

Create an actionable plan with:
1. pathway_step: snake_case id like "behavioral_week_2" matching progress for this mode
2. summary: 2-3 sentences on what to focus on next
3. tasks: at least 3 items mixing:
   - type "retry": must include session_id and turn_id from weak turns above
   - type "exercise": STAR drill or 60s elevator pitch (exercise_kind: star_drill | elevator_pitch)
   - type "pathway": one milestone step for the learning pathway

Each task needs title (short) and instructions (specific, actionable, 1-3 sentences).

Respond with ONLY valid JSON (no markdown):
{
  "pathway_step": "behavioral_week_2",
  "summary": "...",
  "tasks": [
    {
      "type": "retry",
      "title": "...",
      "instructions": "...",
      "session_id": "uuid",
      "turn_id": "uuid"
    },
    {
      "type": "exercise",
      "title": "...",
      "instructions": "...",
      "exercise_kind": "star_drill",
      "topic": "..."
    },
    {
      "type": "pathway",
      "title": "...",
      "instructions": "..."
    }
  ]
}`;
}
