import { suggestPathwayStep } from "@/lib/personalization/pathway";
import type {
  GeneratedPracticePlan,
  SessionWeaknessSummary,
} from "@/lib/personalization/types";

export function buildFallbackPracticePlan(
  weakness: SessionWeaknessSummary,
  sessionCount: number
): GeneratedPracticePlan {
  const pathway_step = suggestPathwayStep({
    mode: weakness.mode,
    sessionCount,
    avgOverall: weakness.session_overall,
  });

  const tasks: GeneratedPracticePlan["tasks"] = [];

  for (const weak of weakness.weak_turns.slice(0, 2)) {
    tasks.push({
      type: "retry",
      title: `Retry: ${truncate(weak.question, 48)}`,
      instructions: `Re-answer this question with clearer structure and specific impact. Focus on: ${weak.improvements[0] ?? "STAR format and metrics"}.`,
      session_id: weak.session_id,
      turn_id: weak.turn_id,
    });
  }

  const topic =
    weakness.top_improvements[0] ??
    weakness.mode.replace(/_/g, " ") + " storytelling";

  tasks.push({
    type: "exercise",
    title: "STAR drill (10 min)",
    instructions: `Pick one past project. Write Situation, Task, Action, Result in bullet form for: ${topic}.`,
    exercise_kind: "star_drill",
    topic,
  });

  tasks.push({
    type: "exercise",
    title: "60-second elevator pitch",
    instructions: `Practice a 60-second pitch for ${weakness.target_role} highlighting your strongest differentiator. Time yourself.`,
    exercise_kind: "elevator_pitch",
    topic: weakness.target_role,
    duration_seconds: 60,
  });

  tasks.push({
    type: "pathway",
    title: "Pathway milestone",
    instructions: `Continue on ${pathway_step.replace(/_/g, " ")}: complete retries and exercises before your next full mock.`,
  });

  const summary =
    weakness.session_overall < 60
      ? `Your session scored ${weakness.session_overall}/100. Prioritize retries on weak answers and STAR structure before the next mock.`
      : `Solid session at ${weakness.session_overall}/100. Sharpen weak spots with targeted retries and short drills.`;

  return { pathway_step, summary, tasks };
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}
