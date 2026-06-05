import type { InterviewMode } from "@/lib/supabase/database.types";

export type PracticeTaskType = "retry" | "exercise" | "pathway";
export type PracticeTaskStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "skipped";

export type ExerciseKind = "star_drill" | "elevator_pitch" | "general";

export type RetryTaskPayload = {
  source_session_id: string;
  turn_id: string;
  question: string;
  mode: InterviewMode;
  target_role: string;
};

export type ExerciseTaskPayload = {
  exercise_kind: ExerciseKind;
  topic?: string;
  duration_seconds?: number;
};

export type PathwayTaskPayload = {
  pathway_step: string;
};

export type PracticeTaskPayload =
  | RetryTaskPayload
  | ExerciseTaskPayload
  | PathwayTaskPayload
  | Record<string, unknown>;

export type PracticeTaskDto = {
  id: string;
  plan_id: string;
  type: PracticeTaskType;
  title: string;
  instructions: string;
  payload: PracticeTaskPayload;
  status: PracticeTaskStatus;
  due_at: string | null;
  completed_at: string | null;
  retry_session_id: string | null;
  created_at: string;
  updated_at: string;
  plan?: {
    session_id: string;
    pathway_step: string | null;
    summary: string;
    created_at: string;
  };
};

export type PracticePlanDto = {
  id: string;
  session_id: string;
  summary: string;
  pathway_step: string | null;
  created_at: string;
  tasks: PracticeTaskDto[];
};

export type WeakTurnContext = {
  turn_id: string;
  session_id: string;
  question: string;
  answer: string;
  mode: InterviewMode;
  target_role: string;
  overall_score: number;
  improvements: string[];
};

export type SessionWeaknessSummary = {
  session_id: string;
  mode: InterviewMode;
  target_role: string;
  session_overall: number;
  weak_turns: WeakTurnContext[];
  top_improvements: string[];
  dimension_averages: Record<string, number>;
};

export type GeneratedPracticePlan = {
  pathway_step: string;
  summary: string;
  tasks: Array<{
    type: PracticeTaskType;
    title: string;
    instructions: string;
    session_id?: string;
    turn_id?: string;
    exercise_kind?: ExerciseKind;
    topic?: string;
    duration_seconds?: number;
  }>;
};
