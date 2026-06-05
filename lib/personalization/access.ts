import { isMissingTableError } from "@/lib/db/schema-errors";
import { isPracticeSchemaAvailable } from "@/lib/db/schema-status";
import type {
  PracticePlanDto,
  PracticeTaskDto,
  PracticeTaskPayload,
  PracticeTaskStatus,
  PracticeTaskType,
} from "@/lib/personalization/types";
import { createClient } from "@/lib/supabase/server";

export async function isPracticePersonalizationAvailable(): Promise<boolean> {
  return isPracticeSchemaAvailable();
}

function mapTask(row: Record<string, unknown>): PracticeTaskDto {
  return {
    id: row.id as string,
    plan_id: row.plan_id as string,
    type: row.type as PracticeTaskType,
    title: row.title as string,
    instructions: row.instructions as string,
    payload: (row.payload ?? {}) as PracticeTaskPayload,
    status: row.status as PracticeTaskStatus,
    due_at: (row.due_at as string | null) ?? null,
    completed_at: (row.completed_at as string | null) ?? null,
    retry_session_id: (row.retry_session_id as string | null) ?? null,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

export async function getPlanForSession(
  sessionId: string
): Promise<PracticePlanDto | null> {
  const supabase = await createClient();

  const { data: plan, error: planError } = await supabase
    .from("practice_plans")
    .select("id, session_id, summary, pathway_step, created_at")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (planError && isMissingTableError(planError)) return null;
  if (!plan) return null;

  const { data: tasks, error: tasksError } = await supabase
    .from("practice_tasks")
    .select(
      "id, plan_id, type, title, instructions, payload, status, due_at, completed_at, retry_session_id, created_at, updated_at"
    )
    .eq("plan_id", plan.id)
    .order("created_at", { ascending: true });

  if (tasksError && isMissingTableError(tasksError)) return null;

  return {
    id: plan.id,
    session_id: plan.session_id,
    summary: plan.summary,
    pathway_step: plan.pathway_step,
    created_at: plan.created_at,
    tasks: (tasks ?? []).map((t) => mapTask(t as Record<string, unknown>)),
  };
}

export async function listPracticeTasksForUser(
  userId: string,
  options?: { includeCompleted?: boolean; limit?: number }
): Promise<PracticeTaskDto[]> {
  const supabase = await createClient();
  const limit = options?.limit ?? 30;

  let query = supabase
    .from("practice_tasks")
    .select(
      "id, plan_id, type, title, instructions, payload, status, due_at, completed_at, retry_session_id, created_at, updated_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!options?.includeCompleted) {
    query = query.in("status", ["pending", "in_progress"]);
  }

  const { data, error } = await query;

  if (error) {
    if (isMissingTableError(error)) return [];
    throw new Error(error.message);
  }

  const tasks = (data ?? []).map((row) =>
    mapTask(row as Record<string, unknown>)
  );

  const planIds = [...new Set(tasks.map((t) => t.plan_id))];
  if (planIds.length === 0) return tasks;

  const { data: plans, error: plansError } = await supabase
    .from("practice_plans")
    .select("id, session_id, pathway_step, summary, created_at")
    .in("id", planIds);

  if (plansError && isMissingTableError(plansError)) return tasks;

  const planById = new Map(
    (plans ?? []).map((p) => [
      p.id,
      {
        session_id: p.session_id,
        pathway_step: p.pathway_step,
        summary: p.summary,
        created_at: p.created_at,
      },
    ])
  );

  for (const task of tasks) {
    const plan = planById.get(task.plan_id);
    if (plan) task.plan = plan;
  }

  return tasks;
}

export async function getPracticeTaskForUser(
  taskId: string,
  userId: string
): Promise<PracticeTaskDto | null> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("practice_tasks")
    .select(
      "id, plan_id, type, title, instructions, payload, status, due_at, completed_at, retry_session_id, created_at, updated_at"
    )
    .eq("id", taskId)
    .eq("user_id", userId)
    .maybeSingle();

  return row ? mapTask(row as Record<string, unknown>) : null;
}

export async function getLatestPathwayStep(
  userId: string
): Promise<{ pathway_step: string | null; plan_created_at: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("practice_plans")
    .select("pathway_step, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error && isMissingTableError(error)) {
    return { pathway_step: null, plan_created_at: null };
  }

  return {
    pathway_step: data?.pathway_step ?? null,
    plan_created_at: data?.created_at ?? null,
  };
}
