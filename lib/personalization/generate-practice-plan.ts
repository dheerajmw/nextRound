import { z } from "zod";
import { getEvaluationsForSession } from "@/lib/evaluation/access";
import type { EvaluationFeedback, EvaluationScores } from "@/lib/evaluation/types";
import { extractJsonObject } from "@/lib/interview/parse-json";
import { getAnswerText } from "@/lib/interview/answer-text";
import { getTurnsForSession } from "@/lib/interview/session-access";
import { completeWithFallback } from "@/lib/llm/client";
import { hasLlmKeys } from "@/lib/env";
import { aggregateSessionWeaknesses } from "@/lib/personalization/aggregate-weaknesses";
import { buildFallbackPracticePlan } from "@/lib/personalization/fallback-plan";
import {
  getPlanForSession,
  isPracticePersonalizationAvailable,
} from "@/lib/personalization/access";
import { isMissingTableError } from "@/lib/db/schema-errors";
import type {
  ExerciseKind,
  GeneratedPracticePlan,
  PracticePlanDto,
  PracticeTaskDto,
  PracticeTaskPayload,
  PracticeTaskType,
} from "@/lib/personalization/types";
import { buildGeneratePracticePlanPrompt } from "@/prompts/v1/generate-practice-plan";
import { createClient } from "@/lib/supabase/server";
import type { InterviewMode, Json } from "@/lib/supabase/database.types";

const PROMPT_VERSION = "v1/practice-plan";

const planSchema = z.object({
  pathway_step: z.string().min(3),
  summary: z.string().min(10),
  tasks: z
    .array(
      z.object({
        type: z.enum(["retry", "exercise", "pathway"]),
        title: z.string().min(3),
        instructions: z.string().min(10),
        session_id: z.string().uuid().optional(),
        turn_id: z.string().uuid().optional(),
        exercise_kind: z
          .enum(["star_drill", "elevator_pitch", "general"])
          .optional(),
        topic: z.string().optional(),
        duration_seconds: z.number().int().positive().optional(),
      })
    )
    .min(2),
});

export async function generatePracticePlanForSession(params: {
  userId: string;
  sessionId: string;
}): Promise<PracticePlanDto | null> {
  if (!(await isPracticePersonalizationAvailable())) {
    return null;
  }

  const existing = await getPlanForSession(params.sessionId);
  if (existing) return existing;

  const supabase = await createClient();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, user_id, status, mode, target_role, session_scores")
    .eq("id", params.sessionId)
    .eq("user_id", params.userId)
    .eq("status", "completed")
    .maybeSingle();

  if (!session) return null;

  const turns = await getTurnsForSession(params.sessionId);
  const evaluations = await getEvaluationsForSession(params.sessionId);

  const evalByTurn = new Map(
    evaluations.map((e) => [e.turn_id, e])
  );

  const turnsWithEval = turns.map((t) => {
    const ev = evalByTurn.get(t.id);
    return ev
      ? {
          ...t,
          evaluation: {
            scores: ev.scores,
            feedback: ev.feedback,
          },
        }
      : t;
  });

  if (evaluations.length === 0) return null;

  const weakness = aggregateSessionWeaknesses({
    sessionId: params.sessionId,
    mode: session.mode as InterviewMode,
    targetRole: session.target_role?.trim() ?? "Software Engineer",
    sessionScores: session.session_scores as EvaluationScores | null,
    turns: turnsWithEval,
  });

  const { count: sessionCount } = await supabase
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", params.userId)
    .eq("status", "completed");

  let generated: GeneratedPracticePlan;

  if (hasLlmKeys()) {
    try {
      generated = await generateWithLlm(weakness);
    } catch {
      generated = buildFallbackPracticePlan(
        weakness,
        sessionCount ?? 1
      );
    }
  } else {
    generated = buildFallbackPracticePlan(weakness, sessionCount ?? 1);
  }

  return persistPlan({
    userId: params.userId,
    sessionId: params.sessionId,
    generated,
    weakness,
    mode: session.mode as InterviewMode,
    targetRole: session.target_role?.trim() ?? "Software Engineer",
    turns,
  });
}

async function generateWithLlm(
  weakness: ReturnType<typeof aggregateSessionWeaknesses>
): Promise<GeneratedPracticePlan> {
  const prompt = buildGeneratePracticePlanPrompt(weakness);
  const result = await completeWithFallback(prompt, 2048);
  const jsonText = extractJsonObject(result.text);
  const parsed = planSchema.parse(JSON.parse(jsonText));
  return parsed;
}

async function persistPlan(params: {
  userId: string;
  sessionId: string;
  generated: GeneratedPracticePlan;
  weakness: ReturnType<typeof aggregateSessionWeaknesses>;
  mode: InterviewMode;
  targetRole: string;
  turns: Awaited<ReturnType<typeof getTurnsForSession>>;
}): Promise<PracticePlanDto | null> {
  const supabase = await createClient();

  const { data: plan, error: planError } = await supabase
    .from("practice_plans")
    .insert({
      user_id: params.userId,
      session_id: params.sessionId,
      summary: params.generated.summary.trim(),
      pathway_step: params.generated.pathway_step.trim(),
    })
    .select("id, session_id, summary, pathway_step, created_at")
    .single();

  if (planError || !plan) {
    if (planError && isMissingTableError(planError)) return null;
    if (planError?.code === "23505") {
      return getPlanForSession(params.sessionId);
    }
    throw new Error(planError?.message ?? "Failed to create practice plan");
  }

  const turnById = new Map(params.turns.map((t) => [t.id, t]));
  const dueBase = new Date();
  dueBase.setDate(dueBase.getDate() + 3);

  const taskRows = params.generated.tasks.flatMap((task, index) => {
    const due = new Date(dueBase);
    due.setDate(due.getDate() + index);

    let payload: PracticeTaskPayload = { prompt_version: PROMPT_VERSION };

    if (task.type === "retry") {
      const weak =
        params.weakness.weak_turns.find(
          (w) => w.turn_id === task.turn_id && w.session_id === task.session_id
        ) ??
        params.weakness.weak_turns.find((w) => w.turn_id === task.turn_id) ??
        params.weakness.weak_turns[0];
      const turnId = weak?.turn_id ?? task.turn_id ?? "";
      const turn = turnId ? turnById.get(turnId) : undefined;

      payload = {
        source_session_id: weak?.session_id ?? params.sessionId,
        turn_id: turnId,
        question: turn?.question ?? weak?.question ?? "",
        mode: params.mode,
        target_role: params.targetRole,
      };
    } else if (task.type === "exercise") {
      payload = {
        exercise_kind: (task.exercise_kind ?? "general") as ExerciseKind,
        topic: task.topic,
        duration_seconds: task.duration_seconds,
      };
    } else {
      payload = {
        pathway_step: params.generated.pathway_step,
      };
    }

    if (
      task.type === "retry" &&
      !(payload as { question?: string }).question?.trim()
    ) {
      return [];
    }

    return [
      {
        plan_id: plan.id,
        user_id: params.userId,
        type: task.type as PracticeTaskType,
        title: task.title.trim(),
        instructions: task.instructions.trim(),
        payload: payload as Json,
        due_at: due.toISOString(),
      },
    ];
  });

  if (taskRows.length < 2) {
    const extra = buildFallbackPracticePlan(
      params.weakness,
      1
    ).tasks.slice(taskRows.length);
    for (const task of extra) {
      const due = new Date();
      due.setDate(due.getDate() + taskRows.length + 1);
      let payload: PracticeTaskPayload = {};
      if (task.type === "retry" && params.weakness.weak_turns[0]) {
        const w = params.weakness.weak_turns[0];
        payload = {
          source_session_id: w.session_id,
          turn_id: w.turn_id,
          question: w.question,
          mode: params.mode,
          target_role: params.targetRole,
        };
      } else if (task.type === "exercise") {
        payload = {
          exercise_kind: task.exercise_kind ?? "general",
          topic: task.topic,
        };
      } else {
        payload = { pathway_step: params.generated.pathway_step };
      }
      taskRows.push({
        plan_id: plan.id,
        user_id: params.userId,
        type: task.type as PracticeTaskType,
        title: task.title.trim(),
        instructions: task.instructions.trim(),
        payload: payload as Json,
        due_at: due.toISOString(),
      });
    }
  }

  const { data: insertedTasks, error: tasksError } = await supabase
    .from("practice_tasks")
    .insert(taskRows)
    .select(
      "id, plan_id, type, title, instructions, payload, status, due_at, completed_at, retry_session_id, created_at, updated_at"
    );

  if (tasksError) {
    if (isMissingTableError(tasksError)) {
      await supabase.from("practice_plans").delete().eq("id", plan.id);
      return null;
    }
    await supabase.from("practice_plans").delete().eq("id", plan.id);
    throw new Error(tasksError.message);
  }

  return {
    id: plan.id,
    session_id: plan.session_id,
    summary: plan.summary,
    pathway_step: plan.pathway_step,
    created_at: plan.created_at,
    tasks: (insertedTasks ?? []).map((row) => ({
      id: row.id,
      plan_id: row.plan_id,
      type: row.type as PracticeTaskType,
      title: row.title,
      instructions: row.instructions,
      payload: row.payload as PracticeTaskPayload,
      status: row.status as PracticeTaskDto["status"],
      due_at: row.due_at,
      completed_at: row.completed_at,
      retry_session_id: row.retry_session_id,
      created_at: row.created_at,
      updated_at: row.updated_at,
    })),
  };
}
