import type {
  SessionEvaluationResult,
  TurnEvaluationDto,
} from "@/lib/evaluation/types";
import type {
  InterviewDifficulty,
  InterviewInputMode,
  InterviewTurnType,
} from "@/lib/interview/constants";
import type { InterviewMode, InterviewSessionStatus } from "@/lib/supabase/database.types";

export type InterviewTurnDto = {
  id: string;
  turn_index: number;
  question: string;
  rationale: string | null;
  answer_text: string | null;
  transcript: string | null;
  turn_type: InterviewTurnType;
  primary_question_index: number | null;
  audio_url: string | null;
  created_at: string;
  answered_at: string | null;
};

export type InterviewSessionDto = {
  id: string;
  status: InterviewSessionStatus;
  mode: InterviewMode;
  target_role: string | null;
  session_scores?: import("@/lib/evaluation/types").EvaluationScores | null;
  adaptive: boolean;
  difficulty: InterviewDifficulty;
  input_mode: InterviewInputMode;
  max_followups_per_topic: number;
  main_questions_completed: number;
  current_topic_followups: number;
  question_limit: number;
  practice_task_id: string | null;
  company_profile_id: string | null;
  created_at: string;
  updated_at: string;
};

export type InterviewSessionDetail = InterviewSessionDto & {
  turns: InterviewTurnDto[];
  total_questions: number;
  evaluations?: TurnEvaluationDto[];
  evaluation_summary?: SessionEvaluationResult["summary"] | null;
};

export type GeneratedQuestion = {
  question: string;
  rationale: string;
};

export type PreviousTurnContext = {
  question: string;
  answer: string;
};

export type TurnSubmitResult = {
  completed: boolean;
  session: InterviewSessionDto;
  turns: InterviewTurnDto[];
  turn?: InterviewTurnDto;
  is_follow_up?: boolean;
  adaptive_triggered?: boolean;
  evaluations?: TurnEvaluationDto[];
  evaluation_summary?: SessionEvaluationResult["summary"];
  evaluation_error?: string;
  progress: {
    current: number;
    total: number;
  };
};
